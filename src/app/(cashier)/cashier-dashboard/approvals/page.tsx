import { checkLayoutGuard } from "@/lib/layout-guard";
import { resolveActiveBranchContext } from "@/lib/branch-context";
import { db } from "@/db";
import { qrCustomerRequests, branches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ApprovalsClient } from "./client";

export default async function ApprovalsPage() {
  await checkLayoutGuard();
  const ctx = await resolveActiveBranchContext();

  let formattedRequests: any[] = [];

  if (ctx?.activeBranchId) {
    const requests = await db.select()
      .from(qrCustomerRequests)
      .where(and(
        eq(qrCustomerRequests.branchId, ctx.activeBranchId),
        eq(qrCustomerRequests.status, "PENDING")
      ))
      .all();
      
    formattedRequests = requests.map(req => ({
      id: req.id,
      name: `${req.firstName} ${req.lastName}`,
      email: req.email,
      phone: req.phoneNumber,
      createdAt: Math.floor(req.createdAt.getTime() / 1000)
    }));
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Onay Bekleyen Müşteriler</h1>
        <p className="text-slate-400">QR kod üzerinden kayıt olan ve mağaza onayı bekleyen müşterileri yönetin.</p>
      </div>

      <ApprovalsClient initialRequests={formattedRequests} />
    </div>
  );
}
