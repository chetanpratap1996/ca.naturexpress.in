-- Keep the current firm snapshot and the normalized client-facing read model
-- in one transaction. Client portal queries use RLS on the normalized tables;
-- partner APIs continue to use firm_app_state as their write model.
BEGIN;

CREATE OR REPLACE FUNCTION public.try_uuid(value TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF value IS NULL OR value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN NULL;
  END IF;
  RETURN value::UUID;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.try_date(value TEXT)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF value IS NULL OR value !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RETURN NULL;
  END IF;
  RETURN value::DATE;
EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.try_integer(value TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF value IS NULL OR value !~ '^-?\d+$' THEN
    RETURN NULL;
  END IF;
  RETURN value::INTEGER;
EXCEPTION WHEN numeric_value_out_of_range THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.try_numeric(value TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF value IS NULL OR value !~ '^-?\d+(\.\d+)?$' THEN
    RETURN NULL;
  END IF;
  RETURN value::NUMERIC;
EXCEPTION WHEN numeric_value_out_of_range THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_firm_app_state_normalized(p_firm_id UUID, p_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  v_id UUID;
  v_group_id UUID;
  v_entity_id UUID;
  v_task_id UUID;
  v_task_id_value UUID;
  v_due_date DATE;
BEGIN
  -- Groups are inserted before entities to preserve foreign keys.
  FOR item IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_data->'groups') = 'array' THEN p_data->'groups' ELSE '[]'::JSONB END) LOOP
    v_id := public.try_uuid(item->>'id');
    IF v_id IS NULL THEN CONTINUE; END IF;
    INSERT INTO public.client_groups (
      id, firm_id, group_name, promoter_name, promoter_phone, promoter_email,
      unbilled_wip_total, overdue_fees_total
    ) VALUES (
      v_id, p_firm_id,
      COALESCE(NULLIF(item->>'name', ''), 'Client group'),
      COALESCE(item->>'promoterName', ''),
      COALESCE(item->>'promoterPhone', ''),
      COALESCE(item->>'promoterEmail', ''),
      COALESCE(public.try_numeric(item->>'unbilledWipTotal'), 0),
      COALESCE(public.try_numeric(item->>'overdueFeesTotal'), 0)
    )
    ON CONFLICT (id) DO UPDATE SET
      group_name = EXCLUDED.group_name,
      promoter_name = EXCLUDED.promoter_name,
      promoter_phone = EXCLUDED.promoter_phone,
      promoter_email = EXCLUDED.promoter_email,
      unbilled_wip_total = EXCLUDED.unbilled_wip_total,
      overdue_fees_total = EXCLUDED.overdue_fees_total
    WHERE public.client_groups.firm_id = EXCLUDED.firm_id;
  END LOOP;

  FOR item IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_data->'clients') = 'array' THEN p_data->'clients' ELSE '[]'::JSONB END) LOOP
    v_id := public.try_uuid(item->>'id');
    v_group_id := public.try_uuid(item->>'groupId');
    IF v_id IS NULL OR v_group_id IS NULL
       OR item->>'type' NOT IN ('PVT_LTD','PUBLIC_LTD','LLP','PARTNERSHIP','PROPRIETORSHIP','INDIVIDUAL_HNI','TRUST_NGO')
       OR COALESCE(item->>'pan', '') !~ '^[A-Z]{5}[0-9]{4}[A-Z]$'
       OR NOT EXISTS (SELECT 1 FROM public.client_groups g WHERE g.id = v_group_id AND g.firm_id = p_firm_id) THEN
      CONTINUE;
    END IF;
    INSERT INTO public.client_entities (
      id, firm_id, group_id, entity_name, type, pan, gstin, cin, tan,
      turnover_cr, incorporation_year, penalty_risk_accrued
    ) VALUES (
      v_id, p_firm_id, v_group_id, COALESCE(NULLIF(item->>'name', ''), 'Client entity'),
      (item->>'type')::public.entity_type, item->>'pan', NULLIF(item->>'gstin', ''),
      NULLIF(item->>'cin', ''), NULLIF(item->>'tan', ''),
      COALESCE(public.try_numeric(item->>'turnoverCr'), 0),
      public.try_integer(item->>'incorporationYear'),
      COALESCE(public.try_numeric(item->>'penaltyRiskAccrued'), 0)
    )
    ON CONFLICT (id) DO UPDATE SET
      group_id = EXCLUDED.group_id,
      entity_name = EXCLUDED.entity_name,
      type = EXCLUDED.type,
      pan = EXCLUDED.pan,
      gstin = EXCLUDED.gstin,
      cin = EXCLUDED.cin,
      tan = EXCLUDED.tan,
      turnover_cr = EXCLUDED.turnover_cr,
      incorporation_year = EXCLUDED.incorporation_year,
      penalty_risk_accrued = EXCLUDED.penalty_risk_accrued
    WHERE public.client_entities.firm_id = EXCLUDED.firm_id;
  END LOOP;

  FOR item IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_data->'tasks') = 'array' THEN p_data->'tasks' ELSE '[]'::JSONB END) LOOP
    v_id := public.try_uuid(item->>'id');
    v_entity_id := public.try_uuid(item->>'entityId');
    v_due_date := public.try_date(item->>'dueDate');
    IF v_id IS NULL OR v_entity_id IS NULL OR v_due_date IS NULL
       OR item->>'category' NOT IN ('GST','INCOME_TAX','TAX_AUDIT','TDS','ROC_MCA','TRANSFER_PRICING')
       OR item->>'status' NOT IN ('DOCUMENTS_AWAITED','IN_PREPARATION','MANAGER_REVIEW','PARTNER_SIGN_OFF','FILED_AND_COMPLETED')
       OR item->>'priority' NOT IN ('CRITICAL','HIGH','MEDIUM','LOW')
       OR NOT EXISTS (SELECT 1 FROM public.client_entities e WHERE e.id = v_entity_id AND e.firm_id = p_firm_id) THEN
      CONTINUE;
    END IF;
    INSERT INTO public.compliance_tasks (
      id, firm_id, entity_id, category, title, period, due_date, status, priority,
      penalty_risk, accruing_daily_penalty, missing_docs_list, chase_count,
      last_chase_at, arn_number, official_udin, udin_generated_at, filing_date
    ) VALUES (
      v_id, p_firm_id, v_entity_id, (item->>'category')::public.compliance_category,
      COALESCE(NULLIF(item->>'title', ''), 'Compliance task'),
      COALESCE(NULLIF(item->>'period', ''), 'Unspecified period'), v_due_date,
      (item->>'status')::public.workflow_status, (item->>'priority')::public.task_priority,
      COALESCE(public.try_numeric(item->>'penaltyRisk'), 0),
      COALESCE(public.try_numeric(item->>'accruingDailyPenalty'), 0),
      CASE WHEN jsonb_typeof(item->'missingDocumentsList') = 'array' THEN item->'missingDocumentsList' ELSE '[]'::JSONB END,
      COALESCE(public.try_integer(item->>'chaseCount'), 0),
      public.try_date(item->>'lastChaseDate'), NULLIF(item->>'arnNumber', ''),
      CASE WHEN item->>'officialUdin' ~* '^[0-9]{8}[A-Z0-9]{10}$' THEN UPPER(item->>'officialUdin') ELSE NULL END,
      CASE WHEN item->>'udinGeneratedAt' IS NULL THEN NULL ELSE (item->>'udinGeneratedAt')::TIMESTAMPTZ END,
      public.try_date(item->>'filingDate')
    )
    ON CONFLICT (id) DO UPDATE SET
      entity_id = EXCLUDED.entity_id,
      category = EXCLUDED.category,
      title = EXCLUDED.title,
      period = EXCLUDED.period,
      due_date = EXCLUDED.due_date,
      status = EXCLUDED.status,
      priority = EXCLUDED.priority,
      penalty_risk = EXCLUDED.penalty_risk,
      accruing_daily_penalty = EXCLUDED.accruing_daily_penalty,
      missing_docs_list = EXCLUDED.missing_docs_list,
      chase_count = EXCLUDED.chase_count,
      last_chase_at = EXCLUDED.last_chase_at,
      arn_number = EXCLUDED.arn_number,
      official_udin = EXCLUDED.official_udin,
      udin_generated_at = EXCLUDED.udin_generated_at,
      filing_date = EXCLUDED.filing_date,
      updated_at = CURRENT_TIMESTAMP
    WHERE public.compliance_tasks.firm_id = EXCLUDED.firm_id;
  END LOOP;

  FOR item IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_data->'documents') = 'array' THEN p_data->'documents' ELSE '[]'::JSONB END) LOOP
    v_id := public.try_uuid(item->>'id');
    v_entity_id := public.try_uuid(item->>'entityId');
    v_task_id_value := public.try_uuid(item->>'taskId');
    IF v_id IS NULL OR v_entity_id IS NULL OR COALESCE(item->>'storagePath', '') = ''
       OR item->>'category' NOT IN ('BANK_STATEMENT','GST_INVOICES','TAX_COMPUTATION','AUDIT_REPORT','NOTICE_REPLY','CHALLAN')
       OR item->>'reviewStatus' NOT IN ('PENDING_REVIEW','APPROVED','CORRECTION_NEEDED')
       OR NOT EXISTS (SELECT 1 FROM public.client_entities e WHERE e.id = v_entity_id AND e.firm_id = p_firm_id) THEN
      CONTINUE;
    END IF;
    IF v_task_id_value IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.compliance_tasks t WHERE t.id = v_task_id_value AND t.entity_id = v_entity_id AND t.firm_id = p_firm_id
    ) THEN
      v_task_id_value := NULL;
    END IF;
    INSERT INTO public.documents (
      id, firm_id, entity_id, task_id, category, file_name, file_size_bytes,
      storage_path, mime_type, financial_year, uploaded_by_id,
      review_status, review_notes, reviewed_by_id, reviewed_at
    ) VALUES (
      v_id, p_firm_id, v_entity_id, v_task_id_value,
      (item->>'category')::public.document_category,
      COALESCE(NULLIF(item->>'fileName', ''), 'document'),
      GREATEST(COALESCE(public.try_integer(item->>'sizeBytes'), 0), 0),
      item->>'storagePath', NULLIF(item->>'mimeType', ''),
      COALESCE(NULLIF(item->>'financialYear', ''), 'Unspecified'), auth.uid(),
      (item->>'reviewStatus')::public.doc_review_status,
      NULLIF(item->>'reviewNotes', ''), NULL,
      CASE WHEN item->>'reviewedAt' IS NULL THEN NULL ELSE (item->>'reviewedAt')::TIMESTAMPTZ END
    )
    ON CONFLICT (id) DO UPDATE SET
      entity_id = EXCLUDED.entity_id,
      task_id = EXCLUDED.task_id,
      category = EXCLUDED.category,
      file_name = EXCLUDED.file_name,
      file_size_bytes = EXCLUDED.file_size_bytes,
      storage_path = EXCLUDED.storage_path,
      mime_type = EXCLUDED.mime_type,
      financial_year = EXCLUDED.financial_year,
      review_status = EXCLUDED.review_status,
      review_notes = EXCLUDED.review_notes,
      reviewed_at = EXCLUDED.reviewed_at
    WHERE public.documents.firm_id = EXCLUDED.firm_id;
  END LOOP;

  FOR item IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_data->'invoices') = 'array' THEN p_data->'invoices' ELSE '[]'::JSONB END) LOOP
    v_id := public.try_uuid(item->>'id');
    v_entity_id := public.try_uuid(item->>'entityId');
    v_due_date := public.try_date(item->>'dueDate');
    IF v_id IS NULL OR v_entity_id IS NULL OR v_due_date IS NULL
       OR item->>'status' NOT IN ('PENDING','UTR_SUBMITTED','PAID','OVERDUE')
       OR NOT EXISTS (SELECT 1 FROM public.client_entities e WHERE e.id = v_entity_id AND e.firm_id = p_firm_id) THEN
      CONTINUE;
    END IF;
    INSERT INTO public.invoices (
      id, firm_id, entity_id, invoice_no, service_description, sac_code,
      taxable_amount, gst_rate, gst_amount, total_amount, due_date, status,
      client_utr_number, client_payment_mode, client_payment_date, client_payer_note,
      reconciled_by_id, reconciled_at
    ) VALUES (
      v_id, p_firm_id, v_entity_id, COALESCE(NULLIF(item->>'invoiceNo', ''), v_id::TEXT),
      COALESCE(NULLIF(item->>'serviceDescription', ''), 'Professional services'),
      COALESCE(NULLIF(item->>'sacCode', ''), '998231'),
      COALESCE(public.try_numeric(item->>'taxableAmount'), 0),
      COALESCE(public.try_numeric(item->>'gstRate'), 18),
      COALESCE(public.try_numeric(item->>'gstAmount'), 0),
      COALESCE(public.try_numeric(item->>'amount'), 0), v_due_date,
      (item->>'status')::public.invoice_status,
      NULLIF(item->>'clientUtrNumber', ''),
      CASE WHEN item->>'clientPaymentMode' IN ('UPI','NEFT_RTGS','IMPS','CHEQUE') THEN (item->>'clientPaymentMode')::public.payment_mode ELSE NULL END,
      public.try_date(item->>'clientPaymentDate'), NULLIF(item->>'clientPayerNote', ''),
      NULL, NULL
    )
    ON CONFLICT (id) DO UPDATE SET
      entity_id = EXCLUDED.entity_id,
      invoice_no = EXCLUDED.invoice_no,
      service_description = EXCLUDED.service_description,
      sac_code = EXCLUDED.sac_code,
      taxable_amount = EXCLUDED.taxable_amount,
      gst_rate = EXCLUDED.gst_rate,
      gst_amount = EXCLUDED.gst_amount,
      total_amount = EXCLUDED.total_amount,
      due_date = EXCLUDED.due_date,
      status = EXCLUDED.status,
      client_utr_number = EXCLUDED.client_utr_number,
      client_payment_mode = EXCLUDED.client_payment_mode,
      client_payment_date = EXCLUDED.client_payment_date,
      client_payer_note = EXCLUDED.client_payer_note
    WHERE public.invoices.firm_id = EXCLUDED.firm_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_firm_app_state(p_data JSONB, p_expected_revision BIGINT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_firm_id UUID;
  v_new_revision BIGINT;
BEGIN
  v_firm_id := public.current_user_firm_id();
  IF v_firm_id IS NULL OR public.current_user_role() NOT IN ('SUPER_ADMIN', 'PARTNER') THEN
    RAISE EXCEPTION 'Partner authorization is required to save firm data.' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_data) <> 'object' THEN
    RAISE EXCEPTION 'Firm data must be a JSON object.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.firm_app_state
  SET data = p_data,
      revision = revision + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE firm_id = v_firm_id AND revision = p_expected_revision
  RETURNING revision INTO v_new_revision;
  IF v_new_revision IS NULL THEN
    RAISE EXCEPTION 'Firm data changed in another session. Refresh and retry your update.' USING ERRCODE = '40001';
  END IF;

  PERFORM public.sync_firm_app_state_normalized(v_firm_id, p_data);
  RETURN v_new_revision;
END;
$$;

REVOKE ALL ON FUNCTION public.try_uuid(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.try_date(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.try_integer(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.try_numeric(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_firm_app_state_normalized(UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_firm_app_state(JSONB, BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_firm_app_state(JSONB, BIGINT) TO authenticated;

REVOKE UPDATE ON public.firm_app_state FROM authenticated;
GRANT SELECT, INSERT ON public.firm_app_state TO authenticated;

-- Client roles need row access for their assigned entities, but never broad
-- SELECT on internal assignment, review, penalty, and staff-tracking columns.
REVOKE SELECT ON public.client_groups, public.client_entities, public.compliance_tasks,
  public.documents, public.invoices FROM authenticated;
GRANT SELECT (id, group_name) ON public.client_groups TO authenticated;
GRANT SELECT (id, firm_id, group_id, entity_name, type, pan, gstin, cin, tan, turnover_cr, incorporation_year)
  ON public.client_entities TO authenticated;
GRANT SELECT (id, firm_id, entity_id, category, title, period, due_date, status, missing_docs_list, arn_number, filing_date)
  ON public.compliance_tasks TO authenticated;
GRANT SELECT (id, firm_id, entity_id, task_id, category, file_name, file_size_bytes, storage_path, mime_type, financial_year, review_status, created_at)
  ON public.documents TO authenticated;
GRANT SELECT (id, firm_id, entity_id, invoice_no, service_description, sac_code, taxable_amount, gst_rate, gst_amount, total_amount, due_date, status, client_utr_number, client_payment_mode, client_payment_date, client_payer_note, created_at)
  ON public.invoices TO authenticated;

-- Backfill existing firm snapshots into the scoped read model. Invalid or
-- non-UUID legacy IDs are skipped and remain available only to firm partners.
DO $$
DECLARE
  state_row RECORD;
BEGIN
  FOR state_row IN SELECT firm_id, data FROM public.firm_app_state LOOP
    PERFORM public.sync_firm_app_state_normalized(state_row.firm_id, state_row.data);
  END LOOP;
END;
$$;

COMMIT;
