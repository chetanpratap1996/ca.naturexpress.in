import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const STATUSES = ["IN_PREPARATION", "MANAGER_REVIEW"] as const;

export async function PATCH(request: Request, context: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId)) {
      return NextResponse.json({ success: false, error: "Choose a valid assigned task." }, { status: 400 });
    }
    const body = await request.json();
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ success: false, error: "Choose a permitted task status." }, { status: 400 });
    }
    const supabase = createClient(await cookies());
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    const { data, error } = await supabase.rpc("advance_staff_task", { p_task_id: taskId, p_new_status: body.status });
    if (error) return NextResponse.json({ success: false, error: "This task could not be advanced. Confirm your entity assignment and current task stage." }, { status: 409 });
    return NextResponse.json({ success: true, status: data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Task progress could not be saved. Refresh and try again." }, { status: 503 });
  }
}
