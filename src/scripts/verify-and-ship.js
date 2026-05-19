"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs = require("fs");
var path = require("path");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var status_1, lines, modifiedFiles, addedFiles, deletedFiles, _i, lines_1, line, mode, file, summary, detailParts, commitMessage, tempMsgPath, errMsg;
        return __generator(this, function (_a) {
            console.log("============================================================");
            console.log("🚀 AURA LOYALTY PLATFORM - AUTO VERIFY & SHIP PIPELINE");
            console.log("============================================================");
            try {
                // Step 1: Run TypeScript Compilation Check
                console.log("\n🔄 Adım 1: TypeScript Derleme Kontrolü Koşturuluyor... (npx tsc --noEmit)");
                try {
                    (0, child_process_1.execSync)("npx tsc --noEmit", { stdio: "inherit" });
                    console.log("✅ TypeScript derleme testi başarıyla tamamlandı!");
                }
                catch (_b) {
                    console.error("❌ TypeScript derleme hatası tespit edildi! Lütfen hataları düzelttikten sonra tekrar deneyin.");
                    process.exit(1);
                }
                // Step 2: Run Master Checklist Runner
                console.log("\n🔄 Adım 2: Master Checklist Koşturuluyor... (python3 .agent/scripts/checklist.py .)");
                try {
                    (0, child_process_1.execSync)("python3 .agent/scripts/checklist.py .", { stdio: "inherit" });
                    console.log("✅ Master checklist başarıyla tamamlandı!");
                }
                catch (_c) {
                    console.error("❌ Checklist testlerinden geçilemedi! Lütfen sorunları çözdükten sonra tekrar deneyin.");
                    process.exit(1);
                }
                // Step 3: Git Status & Automated Commit Message Generation
                console.log("\n🔄 Adım 3: Git Durumu Analiz Ediliyor...");
                status_1 = (0, child_process_1.execSync)("git status --porcelain").toString().trim();
                if (!status_1) {
                    console.log("ℹ️ Değişiklik tespit edilmedi. Push edilecek yeni bir çalışma bulunmuyor.");
                    process.exit(0);
                }
                console.log("📝 Değişen Dosyalar:\n" + status_1);
                // AI/Auto-generated commit message synthesis based on changes
                console.log("\n📝 Zeki Commit Mesajı Sentezleniyor...");
                lines = status_1.split("\n");
                modifiedFiles = [];
                addedFiles = [];
                deletedFiles = [];
                for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                    line = lines_1[_i];
                    mode = line.substring(0, 2).trim();
                    file = line.substring(3).trim();
                    if (mode === "M")
                        modifiedFiles.push(path.basename(file));
                    else if (mode === "A" || mode === "??")
                        addedFiles.push(path.basename(file));
                    else if (mode === "D")
                        deletedFiles.push(path.basename(file));
                }
                summary = "refactor: lean SaaS architecture cleanup & secure access hardening";
                if (modifiedFiles.includes("layout-guard.ts") || modifiedFiles.includes("middleware.ts")) {
                    summary = "security: harden security isolation, bypass Clerk webhook delay with live Hot-Sync, and remove Activation Room";
                }
                if (modifiedFiles.includes("CustomerManagement.tsx") || modifiedFiles.includes("page.tsx")) {
                    if (modifiedFiles.includes("CustomerManagement.tsx")) {
                        summary = "feat: remove customer add capability from Boss panel, and integrate live Hot-Sync sync bypass";
                    }
                }
                detailParts = [];
                if (addedFiles.length > 0)
                    detailParts.push("Added: [".concat(addedFiles.join(", "), "]"));
                if (modifiedFiles.length > 0)
                    detailParts.push("Modified: [".concat(modifiedFiles.join(", "), "]"));
                if (deletedFiles.length > 0)
                    detailParts.push("Deleted: [".concat(deletedFiles.join(", "), "]"));
                commitMessage = "".concat(summary, "\n\n").concat(detailParts.join("\n"), "\n\n- Verified by Auto-Ship Pipeline with zero TypeScript / lint compiler errors.");
                console.log("------------------------------------------------------------");
                console.log("💡 OLUŞTURULAN COMMİT MESAJI:");
                console.log(commitMessage);
                console.log("------------------------------------------------------------");
                // Stage all changes
                console.log("\n🔄 Değişiklikler stage ediliyor (git add .)...");
                (0, child_process_1.execSync)("git add .", { stdio: "inherit" });
                // Commit changes
                console.log("\n🔄 Değişiklikler commit ediliyor (git commit)...");
                tempMsgPath = path.join(__dirname, "temp-commit-msg.txt");
                fs.writeFileSync(tempMsgPath, commitMessage, "utf8");
                (0, child_process_1.execSync)("git commit -F \"".concat(tempMsgPath, "\""), { stdio: "inherit" });
                fs.unlinkSync(tempMsgPath);
                // Push changes
                console.log("\n🚀 Kod GitHub'a push ediliyor (git push)...");
                (0, child_process_1.execSync)("git push", { stdio: "inherit" });
                console.log("\n============================================================");
                console.log("🎉 TEBRİKLER! TÜM ADIMLAR BAŞARIYLA TAMAMLANDI VE KOD PUSH EDİLDİ!");
                console.log("============================================================");
            }
            catch (globalError) {
                errMsg = globalError instanceof Error ? globalError.message : String(globalError);
                console.error("\n❌ Pipeline sırasında beklenmeyen küresel bir hata oluştu:", errMsg);
                process.exit(1);
            }
            return [2 /*return*/];
        });
    });
}
run();
