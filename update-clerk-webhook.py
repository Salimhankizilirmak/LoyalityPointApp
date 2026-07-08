import re

file_path = "src/app/api/webhooks/clerk/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# user.created içerisindeki users ekleme kısmı
old_created = """            if (result.length > 0) {
                console.log(`[ClerkWebhook] Customer name updated to '${name}' for ${result.length} record(s) with phone ${cleanPhone}`);
            }
        }
      } catch (dbErr) {"""

new_created = """            if (result.length > 0) {
                console.log(`[ClerkWebhook] Customer name updated to '${name}' for ${result.length} record(s) with phone ${cleanPhone}`);
            }
        }
        
        // --- USERS tablosu senkronizasyonu ---
        // Eğer role belli değilse bile en azından isim ve mail eşleşmesi için (isteğe bağlı)
        const existingUser = await db.select().from(users).where(eq(users.clerkId, clerkId)).get();
        if (!existingUser && email) {
          try {
             await db.insert(users).values({
               clerkId: clerkId,
               email: email.toLowerCase(),
               role: "CUSTOMER", // Varsayılan müşteri, login olunca auth-utils günceller
               name: name,
             });
             console.log(`[ClerkWebhook] Inserted new user to users table with name: ${name}`);
          } catch(e) {
             console.error("[ClerkWebhook] Error inserting to users table on user.created:", e);
          }
        } else if (existingUser && name) {
           await db.update(users).set({ name }).where(eq(users.clerkId, clerkId));
        }

      } catch (dbErr) {"""

content = content.replace(old_created, new_created)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
