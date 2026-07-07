/* =====================================================================
   wedo. — app/api/admin/me/route.ts (GET)
   ¿El usuario autenticado es administrador? { admin: boolean }
   Chequeo ligero para enrutar (el panel valida de nuevo por su cuenta).
   ===================================================================== */
import { NextResponse } from "next/server";
import { getUserFromRequest, esAdmin } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ admin: false });
    return NextResponse.json({ admin: await esAdmin(user.id) });
  } catch {
    return NextResponse.json({ admin: false });
  }
}
