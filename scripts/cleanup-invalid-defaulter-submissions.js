import { supabase } from '../api/db/supabaseClient.js';

/**
 * This script removes defaulter work submissions for students with attendance >= 75%
 * These submissions should not exist as defaulter work is only for students with low attendance
 */

async function cleanupInvalidDefaulterSubmissions() {
  try {
    console.log('Starting cleanup of invalid defaulter work submissions...\n');
    
    // Get the defaulter work submission type ID
    const { data: defaulterType, error: typeError } = await supabase
      .from('submission_types')
      .select('id, name')
      .eq('name', 'Defaulter work')
      .limit(1)
      .single();

    if (typeError) {
      console.error('Error fetching defaulter work type:', typeError);
      return;
    }

    if (!defaulterType) {
      console.log('No "Defaulter work" submission type found.');
      return;
    }

    console.log(`Found Defaulter work type with ID: ${defaulterType.id}\n`);

    // Get all students with their attendance
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, roll_no, attendance_percent');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return;
    }

    console.log(`Found ${students.length} students\n`);

    // Filter students with attendance >= 75%
    const studentsWithGoodAttendance = students.filter(s => {
      const attendance = parseFloat(s.attendance_percent) || 0;
      return attendance >= 75;
    });

    console.log(`Found ${studentsWithGoodAttendance.length} students with attendance >= 75%\n`);

    if (studentsWithGoodAttendance.length === 0) {
      console.log('✓ No students with attendance >= 75% found. Nothing to clean up.');
      return;
    }

    const studentIds = studentsWithGoodAttendance.map(s => s.id);

    // Find defaulter work submissions for these students
    const { data: invalidSubmissions, error: submissionsError } = await supabase
      .from('student_submissions')
      .select('id, student_id, subject_id, status')
      .eq('submission_type_id', defaulterType.id)
      .in('student_id', studentIds);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return;
    }

    if (!invalidSubmissions || invalidSubmissions.length === 0) {
      console.log('✓ No invalid defaulter work submissions found!');
      return;
    }

    console.log(`⚠️  Found ${invalidSubmissions.length} invalid defaulter work submissions:\n`);

    // Show details
    invalidSubmissions.forEach(sub => {
      const student = studentsWithGoodAttendance.find(s => s.id === sub.student_id);
      if (student) {
        console.log(`  - Student: ${student.name} (Roll: ${student.roll_no})`);
        console.log(`    Attendance: ${student.attendance_percent}%`);
        console.log(`    Status: ${sub.status}`);
        console.log(`    Submission ID: ${sub.id}\n`);
      }
    });

    // Delete these invalid submissions
    console.log('Deleting invalid submissions...');
    const submissionIds = invalidSubmissions.map(s => s.id);

    const { error: deleteError } = await supabase
      .from('student_submissions')
      .delete()
      .in('id', submissionIds);

    if (deleteError) {
      console.error('Error deleting submissions:', deleteError);
      return;
    }

    console.log(`\n✓ Successfully deleted ${invalidSubmissions.length} invalid defaulter work submissions!`);
    console.log('\nThese students should no longer see defaulter work marked in the UI.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
cleanupInvalidDefaulterSubmissions()
  .then(() => {
    console.log('\n✓ Cleanup completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
