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
var dotenv = require("dotenv");
var path_1 = require("path");
var readline = require("readline");
// npx tsx src/scripts/clear-database.ts
dotenv.config({ path: (0, path_1.resolve)(__dirname, "../../.env.local") });
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function clearDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var question, confirmation, db, _a, organizations, staffProfiles, customerProfiles, pointsTransactions, branches, users, _b, ne, and, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("\n====================================================");
                    console.log("🛡️  GÜVENLİK DENETİMİ: VERİTABANI SIFIRLAMA");
                    console.log("====================================================\n");
                    if (process.env.NODE_ENV === "production" && process.env.SECURITY_WIPE_BYPASS !== "true") {
                        console.error("❌ HATA: Canlı (Production) ortamda bu scripti çalıştıramazsınız!");
                        console.error("Güvenlik nedeniyle işlem durduruldu.");
                        process.exit(1);
                    }
                    if (process.env.SECURITY_WIPE_BYPASS !== "true") {
                        console.error("❌ HATA: SECURITY_WIPE_BYPASS=.env.local içinde 'true' olmalıdır.");
                        process.exit(1);
                    }
                    question = function (query) { return new Promise(function (resolve) { return rl.question(query, resolve); }); };
                    console.log("⚠️  DİKKAT: Bu işlem GERİ DÖNDÜRÜLEMEZ!");
                    console.log("Tüm şubeler, müşteriler, puanlar ve işlemler silinecektir.\n");
                    return [4 /*yield*/, question("Devam etmek için 'SISTEMI_SIFIRLA' yazın: ")];
                case 1:
                    confirmation = _c.sent();
                    if (confirmation !== "SISTEMI_SIFIRLA") {
                        console.log("\n❌ İşlem iptal edildi. Hatalı onay kodu.");
                        process.exit(0);
                    }
                    console.log("\n🚀 İşlem onaylandı. Veriler siliniyor...\n");
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("../db"); })];
                case 2:
                    db = (_c.sent()).db;
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("../db/schema"); })];
                case 3:
                    _a = _c.sent(), organizations = _a.organizations, staffProfiles = _a.staffProfiles, customerProfiles = _a.customerProfiles, pointsTransactions = _a.pointsTransactions, branches = _a.branches, users = _a.users;
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("drizzle-orm"); })];
                case 4:
                    _b = _c.sent(), ne = _b.ne, and = _b.and;
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 12, 13, 14]);
                    console.log("1. Transactions (İşlemler) siliniyor...");
                    return [4 /*yield*/, db.delete(pointsTransactions)];
                case 6:
                    _c.sent();
                    console.log("✅ İşlemler silindi.");
                    console.log("2. Customer Profiles (Müşteri Profilleri) siliniyor...");
                    return [4 /*yield*/, db.delete(customerProfiles)];
                case 7:
                    _c.sent();
                    console.log("✅ Müşteri profilleri silindi.");
                    console.log("3. Staff Profiles (Personel Profilleri) siliniyor...");
                    return [4 /*yield*/, db.delete(staffProfiles)];
                case 8:
                    _c.sent();
                    console.log("✅ Personel profilleri silindi.");
                    console.log("4. Branches (Şubeler) siliniyor...");
                    return [4 /*yield*/, db.delete(branches)];
                case 9:
                    _c.sent();
                    console.log("✅ Şubeler silindi.");
                    console.log("5. Organizations (Ana Organizasyonlar) siliniyor...");
                    return [4 /*yield*/, db.delete(organizations)];
                case 10:
                    _c.sent();
                    console.log("✅ Organizasyonlar silindi.");
                    console.log("6. Users (Süper Admin Dışındaki Kullanıcılar) siliniyor...");
                    // Keep 'novexistech@gmail.com' and ADMIN users
                    return [4 /*yield*/, db.delete(users).where(and(ne(users.email, "novexistech@gmail.com"), ne(users.role, "SUPER_ADMIN")))];
                case 11:
                    // Keep 'novexistech@gmail.com' and ADMIN users
                    _c.sent();
                    console.log("✅ Diğer kullanıcılar silindi.");
                    console.log("\n🎉 TÜM YEREL VERİLER BAŞARIYLA SİLİNDİ! 🎉");
                    console.log("-------------------------------------------------------------------");
                    console.log("🔴 KRİTİK GÜVENLİK NOTU:");
                    console.log("Bu işlem SADECE yerel Turso veritabanını temizlemiştir.");
                    console.log("Clerk üzerindeki 'Bekleyen Davetler' (Invitations) hala AKTİFTİR.");
                    console.log("Güvenlik için Clerk Dashboard üzerinden davetleri manuel silmelisiniz:");
                    console.log("-> Clerk Dashboard > Organizations > [Org Seç] > Invitations");
                    console.log("-------------------------------------------------------------------");
                    console.log("Sistemde şu an sadece .env.local dosyasındaki Süper Adminler bulunmaktadır.");
                    return [3 /*break*/, 14];
                case 12:
                    error_1 = _c.sent();
                    console.error("\n❌ Veri silme işlemi sırasında bir hata oluştu:", error_1);
                    console.log("Hata detayı:", error_1 instanceof Error ? error_1.message : String(error_1));
                    return [3 /*break*/, 14];
                case 13:
                    rl.close();
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
clearDatabase().catch(function (err) {
    console.error(err);
    rl.close();
});
