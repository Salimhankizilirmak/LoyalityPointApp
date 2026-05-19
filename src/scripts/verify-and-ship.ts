import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

async function run() {
  console.log("============================================================");
  console.log("🚀 AURA LOYALTY PLATFORM - AUTO VERIFY & SHIP PIPELINE");
  console.log("============================================================");

  try {
    // Step 1: Run TypeScript Compilation Check
    console.log("\n🔄 Adım 1: TypeScript Derleme Kontrolü Koşturuluyor... (npx tsc --noEmit)");
    try {
      execSync("npx tsc --noEmit", { stdio: "inherit" });
      console.log("✅ TypeScript derleme testi başarıyla tamamlandı!");
    } catch {
      console.error("❌ TypeScript derleme hatası tespit edildi! Lütfen hataları düzelttikten sonra tekrar deneyin.");
      process.exit(1);
    }

    // Step 2: Run Master Checklist Runner
    console.log("\n🔄 Adım 2: Master Checklist Koşturuluyor... (python3 .agent/scripts/checklist.py .)");
    try {
      execSync("python3 .agent/scripts/checklist.py .", { stdio: "inherit" });
      console.log("✅ Master checklist başarıyla tamamlandı!");
    } catch {
      console.error("❌ Checklist testlerinden geçilemedi! Lütfen sorunları çözdükten sonra tekrar deneyin.");
      process.exit(1);
    }

    // Step 3: Git Status & Automated Commit Message Generation
    console.log("\n🔄 Adım 3: Git Durumu Analiz Ediliyor...");
    const status = execSync("git status --porcelain").toString().trim();
    if (!status) {
      console.log("ℹ️ Değişiklik tespit edilmedi. Push edilecek yeni bir çalışma bulunmuyor.");
      process.exit(0);
    }

    console.log("📝 Değişen Dosyalar:\n" + status);

    // AI/Auto-generated commit message synthesis based on changes
    console.log("\n📝 Zeki Commit Mesajı Sentezleniyor...");
    
    // Parse changes to build a neat structured commit
    const lines = status.split("\n");
    const modifiedFiles: string[] = [];
    const addedFiles: string[] = [];
    const deletedFiles: string[] = [];

    for (const line of lines) {
      const mode = line.substring(0, 2).trim();
      const file = line.substring(3).trim();
      if (mode === "M") modifiedFiles.push(path.basename(file));
      else if (mode === "A" || mode === "??") addedFiles.push(path.basename(file));
      else if (mode === "D") deletedFiles.push(path.basename(file));
    }

    // Determine current task summary based on what was worked on
    let summary = "refactor: lean SaaS architecture cleanup & secure access hardening";
    
    if (modifiedFiles.includes("layout-guard.ts") || modifiedFiles.includes("middleware.ts")) {
      summary = "security: harden security isolation, bypass Clerk webhook delay with live Hot-Sync, and remove Activation Room";
    }
    
    if (modifiedFiles.includes("CustomerManagement.tsx") || modifiedFiles.includes("page.tsx")) {
      if (modifiedFiles.includes("CustomerManagement.tsx")) {
        summary = "feat: remove customer add capability from Boss panel, and integrate live Hot-Sync sync bypass";
      }
    }

    const detailParts: string[] = [];
    if (addedFiles.length > 0) detailParts.push(`Added: [${addedFiles.join(", ")}]`);
    if (modifiedFiles.length > 0) detailParts.push(`Modified: [${modifiedFiles.join(", ")}]`);
    if (deletedFiles.length > 0) detailParts.push(`Deleted: [${deletedFiles.join(", ")}]`);

    const commitMessage = `${summary}\n\n${detailParts.join("\n")}\n\n- Verified by Auto-Ship Pipeline with zero TypeScript / lint compiler errors.`;

    console.log("------------------------------------------------------------");
    console.log("💡 OLUŞTURULAN COMMİT MESAJI:");
    console.log(commitMessage);
    console.log("------------------------------------------------------------");

    // Stage all changes
    console.log("\n🔄 Değişiklikler stage ediliyor (git add .)...");
    execSync("git add .", { stdio: "inherit" });

    // Commit changes
    console.log("\n🔄 Değişiklikler commit ediliyor (git commit)...");
    // Write commit message to temporary file to support newlines easily
    const tempMsgPath = path.join(__dirname, "temp-commit-msg.txt");
    fs.writeFileSync(tempMsgPath, commitMessage, "utf8");
    execSync(`git commit -F "${tempMsgPath}"`, { stdio: "inherit" });
    fs.unlinkSync(tempMsgPath);

    // Push changes
    console.log("\n🚀 Kod GitHub'a push ediliyor (git push)...");
    execSync("git push", { stdio: "inherit" });

    console.log("\n============================================================");
    console.log("🎉 TEBRİKLER! TÜM ADIMLAR BAŞARIYLA TAMAMLANDI VE KOD PUSH EDİLDİ!");
    console.log("============================================================");

  } catch (globalError: unknown) {
    const errMsg = globalError instanceof Error ? globalError.message : String(globalError);
    console.error("\n❌ Pipeline sırasında beklenmeyen küresel bir hata oluştu:", errMsg);
    process.exit(1);
  }
}

run();
