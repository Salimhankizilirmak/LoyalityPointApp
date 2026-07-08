import re

file_path = "src/app/(manager)/manager-dashboard/actions.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_add_customer = """    const res = await customerService.inviteCustomer({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      branchId,
      orgId,
      invitedById: dbUserLocal.id,
    });

    return res;"""

new_add_customer = """    const res = await customerService.inviteCustomer({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      branchId,
      orgId,
      invitedById: dbUserLocal.id,
    });

    if (res.success) {
      await db.insert(activityLogs).values({
        orgId,
        type: "system",
        actorName: dbUserLocal.name || dbUserLocal.email || "Yönetici",
        actorRole: dbUserLocal.role,
        targetName: `${firstName.trim()} ${lastName.trim()}`,
        description: `Yeni müşteri sisteme davet edildi. (Tel: ${phone.trim()})`
      });
    }

    return res;"""

content = content.replace(old_add_customer, new_add_customer)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
