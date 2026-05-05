# Database Fix Scripts

## Fix Duplicate Submission Types

If you're seeing errors like "JSON object requested, multiple (or no) rows returned" when marking submissions, it means you have duplicate submission types in your database.

### To fix this:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the fix script:
   ```bash
   npm run fix-duplicates
   ```

This script will:
- Find all duplicate submission types (TA, CIE, Defaulter work)
- Keep only one entry per type
- Update all existing student submissions to reference the kept entry
- Delete the duplicate entries

### What it does:
- Identifies duplicates by name
- Keeps the first entry (lowest ID)
- Updates `student_submissions` table to use the kept ID
- Deletes duplicate entries
- Shows a summary of changes

### Safe to run:
- The script checks for references before deleting
- Updates existing data to prevent orphaned records
- Shows what it will do before making changes

---

## Cleanup Invalid Defaulter Work Submissions

If you see students with attendance >= 75% showing completed defaulter work, this means there are invalid submissions in the database. Defaulter work should only be for students with attendance < 75%.

### To fix this:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the cleanup script:
   ```bash
   npm run cleanup-defaulter
   ```

This script will:
- Find all students with attendance >= 75%
- Identify any defaulter work submissions for these students
- Delete those invalid submissions
- Show a summary of what was cleaned up

### What it does:
- Checks all students' attendance percentages
- Finds defaulter work submissions for students with good attendance
- Removes those invalid submissions from the database
- Displays details of cleaned submissions

### Safe to run:
- Only removes submissions that violate the attendance rule
- Shows what will be deleted before making changes
- Can be run multiple times safely
