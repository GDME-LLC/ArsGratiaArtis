import { requireAdminUser } from "@/lib/admin";
import { deleteAdminManagedUsers } from "@/lib/admin-users";

export async function DELETE(request: Request) {
  try {
    const adminUser = await requireAdminUser();
    const payload = (await request.json()) as { userIds?: string[] };

    const result = await deleteAdminManagedUsers({
      actorUserId: adminUser.id,
      userIds: Array.isArray(payload.userIds) ? payload.userIds : [],
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "User removal failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
