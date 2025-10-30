# Step-by-Step GitHub Upload Instructions

Follow these steps to upload your ILE Study Guide to GitHub.

## Method 1: Using GitHub Web Interface (Easiest)

### Step 1: Create a New Repository

1. Go to [https://github.com/sk408](https://github.com/sk408)
2. Click the **"+"** icon in the top-right corner
3. Select **"New repository"**
4. Fill in the repository details:
   - **Repository name**: `ile-study-guide` (or your preferred name)
   - **Description**: "Comprehensive ILE exam study materials with Texas-specific content and interactive practice exams"
   - **Visibility**: Choose **Public** (so others can benefit) or **Private**
   - **✓ Check**: "Add a README file" (you can skip this since we have our own)
   - **✓ Check**: "Add .gitignore" → Select **None** (we have our own)
   - **Add a license**: Select **MIT License** (or choose based on preference)
5. Click **"Create repository"**

### Step 2: Upload Files via Web Interface

#### Option A: Upload Individual Files
1. In your new repository, click **"Add file"** → **"Upload files"**
2. Drag and drop these files from your `C:\Projects\studyguide` folder:
   - `README.md`
   - `LICENSE`
   - `.gitignore`
   - `ILE_Study_Guide.md`
   - `TX-ILE-Practice-Exam.md`
3. Add commit message: "Initial commit - Study guide and practice exam"
4. Click **"Commit changes"**

#### Option B: Upload the Interactive Folder
1. Click **"Add file"** → **"Upload files"**
2. Drag the entire `interactive/` folder
3. Add commit message: "Add interactive practice exam app"
4. Click **"Commit changes"**

#### Option C: Upload Scripts Folder (Optional)
1. Click **"Add file"** → **"Upload files"**
2. Drag the `scripts/` folder
3. Add commit message: "Add PDF generation script"
4. Click **"Commit changes"**

### Step 3: Enable GitHub Pages (For Interactive App)

1. In your repository, click **"Settings"**
2. Scroll down to **"Pages"** in the left sidebar
3. Under **"Source"**, select:
   - Branch: **main** (or **master**)
   - Folder: **/ (root)**
4. Click **"Save"**
5. Wait 1-2 minutes, then visit: `https://sk408.github.io/ile-study-guide/interactive/`

Your interactive practice exam will now be live on the web!

---

## Method 2: Using Git Command Line (Advanced)

### Prerequisites
- Install Git: [https://git-scm.com/downloads](https://git-scm.com/downloads)
- Open Command Prompt, PowerShell, or Terminal

### Steps

#### 1. Navigate to Your Project
```bash
cd C:\Projects\studyguide
```

#### 2. Initialize Git Repository
```bash
git init
```

#### 3. Add All Files
```bash
git add .
```

#### 4. Create First Commit
```bash
git commit -m "Initial commit - ILE Study Guide with interactive practice exams"
```

#### 5. Create GitHub Repository
- Go to [https://github.com/new](https://github.com/new)
- Create repository named `ile-study-guide`
- **DO NOT** initialize with README, .gitignore, or license (we have our own)

#### 6. Link and Push to GitHub
Replace `sk408` with your actual GitHub username if different:

```bash
git remote add origin https://github.com/sk408/ile-study-guide.git
git branch -M main
git push -u origin main
```

#### 7. Enter GitHub Credentials
- Username: `sk408`
- Password: Use a **Personal Access Token** (not your password)
  - Generate token at: [https://github.com/settings/tokens](https://github.com/settings/tokens)
  - Scopes needed: `repo` (all)

---

## Method 3: Using GitHub Desktop (User-Friendly)

### Prerequisites
- Download and install [GitHub Desktop](https://desktop.github.com/)

### Steps

#### 1. Open GitHub Desktop
- Sign in with your GitHub account (sk408)

#### 2. Add Local Repository
1. Click **"File"** → **"Add local repository"**
2. Click **"Choose..."** and navigate to `C:\Projects\studyguide`
3. Click **"Add repository"**

#### 3. Create Initial Commit
1. You'll see all files listed in the left panel
2. Check all files you want to include
3. In the bottom left:
   - **Summary**: "Initial commit"
   - **Description**: "Complete ILE study guide with interactive practice exams"
4. Click **"Commit to main"**

#### 4. Publish to GitHub
1. Click **"Publish repository"** at the top
2. Set repository name: `ile-study-guide`
3. Add description: "ILE exam study materials with Texas-specific content"
4. Choose **Keep this code private** or leave unchecked for public
5. Click **"Publish Repository"**

Done! Your repository is now on GitHub.

---

## Verification Checklist

After uploading, verify your repository has:
- ✅ `README.md` (displays on main page)
- ✅ `LICENSE` (shows license type)
- ✅ `.gitignore` (prevents unnecessary files)
- ✅ `ILE_Study_Guide.md`
- ✅ `TX-ILE-Practice-Exam.md`
- ✅ `interactive/` folder with all files:
  - `index.html`
  - `app.js`
  - `styles.css`
  - `content.json`
  - `exam_section1.json` through `exam_section5.json`
- ✅ `scripts/` folder (optional)

---

## Updating Your Repository Later

### Web Interface
1. Navigate to the file you want to edit
2. Click the **pencil icon** (Edit)
3. Make changes
4. Add commit message
5. Click **"Commit changes"**

### Command Line
```bash
git add .
git commit -m "Description of changes"
git push
```

### GitHub Desktop
1. Make changes to your local files
2. GitHub Desktop will show changed files
3. Write commit summary
4. Click **"Commit to main"**
5. Click **"Push origin"**

---

## Troubleshooting

### "Permission denied" when pushing
- Use a Personal Access Token instead of password
- Generate at: [https://github.com/settings/tokens](https://github.com/settings/tokens)

### Files not showing up
- Make sure they're not excluded by `.gitignore`
- Check if files are actually in the directory
- Refresh your browser

### Interactive app not working on GitHub Pages
- Wait 2-3 minutes after enabling Pages
- Check the URL: `https://sk408.github.io/ile-study-guide/interactive/`
- Ensure all files are in the `interactive/` folder

### Large files (>100MB)
- GitHub has file size limits
- Use Git LFS for large files: [https://git-lfs.github.com/](https://git-lfs.github.com/)

---

## Recommended Next Steps

1. ✅ Upload all files to GitHub
2. ✅ Enable GitHub Pages for interactive app
3. ✅ Share repository URL with others
4. ✅ Star your own repository for easy access
5. ✅ Watch for issues/suggestions from users
6. ✅ Update content as needed

---

## Getting Help

- GitHub Docs: [https://docs.github.com](https://docs.github.com)
- GitHub Support: [https://support.github.com](https://support.github.com)
- Git Handbook: [https://guides.github.com/introduction/git-handbook/](https://guides.github.com/introduction/git-handbook/)

---

**Your repository URL will be:**
```
https://github.com/sk408/ile-study-guide
```

**Your interactive app URL will be:**
```
https://sk408.github.io/ile-study-guide/interactive/
```

Good luck! 🚀

