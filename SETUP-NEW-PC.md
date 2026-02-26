# Rupsy Quiz – Setup Guide for New PC (Including Company PCs)

Use this when setting up the project on a second PC or company machine where you may not have admin rights.

---

## 1. Apps to Install

| App | Notes |
|-----|-------|
| **Git** | https://git-scm.com/ — Install normally |
| **Cursor** (or VS Code) | https://cursor.com/ or https://code.visualstudio.com/ |
| **Node.js** | See below — use **fnm** if the standard installer is blocked (e.g. on company PCs) |

---

## 2. Node.js Installation

### Option A: Standard Install (when you have admin)

- Download: https://nodejs.org/
- Run the installer (Node v18 or v20+)
- Restart terminal when done

### Option B: fnm (no admin, for company PCs)

Use **fnm** (Fast Node Manager) when the Node.js installer is blocked.

1. **Download fnm for Windows**
   - Go to: https://github.com/Schniz/fnm/releases
   - Under **Assets**, download **`fnm-windows.zip`**
   - Extract and place `fnm.exe` in `C:\Users\miha\fnm\`

2. **Add fnm to your PATH (via PowerShell, no admin)**
   ```powershell
   $fnmPath = "C:\Users\miha\fnm"
   $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
   if ($currentPath -notlike "*$fnmPath*") {
       [Environment]::SetEnvironmentVariable("Path", $currentPath + ";" + $fnmPath, "User")
       Write-Host "Added fnm to PATH. Restart PowerShell."
   }
   ```

3. **Create PowerShell profile** (if it doesn't exist)
   ```powershell
   if (!(Test-Path -Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }; notepad $PROFILE
   ```

4. **Add to your profile** (so fnm loads in new terminals):
   ```powershell
   & "C:\Users\miha\fnm\fnm.exe" env --use-on-cd | Out-String | Invoke-Expression
   ```
   Save and close Notepad.

5. **Restart PowerShell**, then install Node:
   ```powershell
   & "C:\Users\miha\fnm\fnm.exe" install 20
   & "C:\Users\miha\fnm\fnm.exe" use 20
   ```

6. **Verify**
   ```powershell
   node --version   # should show v20.x.x
   npm --version    # should show 10.x.x
   ```

---

## 3. Project Setup

### Option A: Git clone

```powershell
cd C:\Users\miha\Desktop
git clone <your-repo-url> rupsy-quiz
cd rupsy-quiz
```

### Option B: Copy folder (USB, cloud drive, or zip)

**Do this:**
- Copy the project folder to the new PC (USB, OneDrive, Google Drive, zip, etc.)

**Do NOT copy** (or delete after copying):
- `node_modules` — reinstall with `npm install` on the new PC
- `.next` — will be recreated when you run `npm run dev`

Copying `node_modules` between PCs (especially different OS) can cause issues with native modules. Reinstalling on the new PC is safer.

**On the new PC:**
```powershell
cd rupsy-quiz
npm install
npm run dev
```

### Optional: Smaller transfer

If you want a smaller copy:
- Copy the folder **without** `node_modules` and `.next`
- Or zip the project, then on the new PC: unzip → remove `node_modules` and `.next` if present → run `npm install`

---

## 4. Dependencies and Dev Server

**Important:** Be in the project folder (`C:\Users\miha\Desktop\rupsy-quiz`), not `C:\Windows\System32`.

If using **fnm**, run these first (each new terminal session):
```powershell
& "C:\Users\miha\fnm\fnm.exe" env --use-on-cd | Out-String | Invoke-Expression
& "C:\Users\miha\fnm\fnm.exe" use 20
```

Then:
```powershell
cd C:\Users\miha\Desktop\rupsy-quiz
npm install
npm run dev
```

Dev server runs at **http://localhost:3000**

---

## 5. Environment Variables

Create `.env.local` in the project root with:

```
# Wix integration
INTERNAL_WIX_SECRET=<your secret>

# Firebase Admin (base64-encoded service account JSON)
FIREBASE_SERVICE_ACCOUNT_BASE64=<your base64 string>

# Firebase client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Copy values from your main PC's `.env.local` or from your hosting provider (e.g. Vercel).

---

## 6. Quick Checklist

| Step | Action |
|------|--------|
| 1 | Install Git |
| 2 | Install Cursor (or VS Code) |
| 3 | Install Node.js (standard or via fnm) |
| 4 | Clone (git) or copy project folder to new PC (skip node_modules & .next) |
| 5 | Create `.env.local` with your secrets |
| 6 | Run `npm install` in project folder |
| 7 | Run `npm run dev` |

---

**Notes:**
- Keep `.env.local` private — never commit it. (It's in `.gitignore`)
- If fnm gives "fnm is not recognized" — use full path: `& "C:\Users\miha\fnm\fnm.exe"` instead of `fnm`
- If `npm install` fails with EPERM — make sure you're in the project folder, not `C:\Windows\System32`
