import { supabase } from '../api/db/supabaseClient.js';

/**
 * This script removes duplicate submission types from the database
 * keeping only one entry per unique name
 */

async function fixDuplicateSubmissionTypes() {
  try {
    console.log('Fetching all submission types...');
    
    // Get all submission types
    const { data: allTypes, error: fetchError } = await supabase
      .from('submission_types')
      .select('*')
      .order('id', { ascending: true });

    if (fetchError) {
      console.error('Error fetching submission types:', fetchError);
      return;
    }

    console.log(`Found ${allTypes.length} submission types`);

    // Group by name
    const typesByName = {};
    allTypes.forEach(type => {
      if (!typesByName[type.name]) {
        typesByName[type.name] = [];
      }
      typesByName[type.name].push(type);
    });

    // Find duplicates
    const duplicates = [];
    Object.entries(typesByName).forEach(([name, types]) => {
      if (types.length > 1) {
        console.log(`\nFound ${types.length} entries for "${name}":`);
        types.forEach(t => console.log(`  - ID: ${t.id}, applicable_to: ${JSON.stringify(t.applicable_to)}`));
        
        // Keep the first one, mark others for deletion
        const [keep, ...toDelete] = types;
        console.log(`  Keeping ID: ${keep.id}, deleting: ${toDelete.map(t => t.id).join(', ')}`);
        duplicates.push(...toDelete.map(t => t.id));
      }
    });

    if (duplicates.length === 0) {
      console.log('\n✓ No duplicates found!');
      return;
    }

    console.log(`\n⚠️  Found ${duplicates.length} duplicate entries to delete`);
    console.log('IDs to delete:', duplicates);

    // Check if any student_submissions reference these IDs
    const { data: submissions, error: submissionsError } = await supabase
      .from('student_submissions')
      .select('id, submission_type_id')
      .in('submission_type_id', duplicates);

    if (submissionsError) {
      console.error('Error checking student submissions:', submissionsError);
      return;
    }

    if (submissions && submissions.length > 0) {
      console.log(`\n⚠️  Warning: ${submissions.length} student submissions reference these duplicate types`);
      console.log('We need to update them first...');

      // Update student_submissions to use the kept IDs
      for (const [name, types] of Object.entries(typesByName)) {
        if (types.length > 1) {
          const [keep, ...toDelete] = types;
          const deleteIds = toDelete.map(t => t.id);
          
          console.log(`\nUpdating submissions for "${name}" from IDs ${deleteIds.join(', ')} to ${keep.id}...`);
          
          const { error: updateError } = await supabase
            .from('student_submissions')
            .update({ submission_type_id: keep.id })
            .in('submission_type_id', deleteIds);

          if (updateError) {
            console.error(`Error updating submissions for ${name}:`, updateError);
            return;
          }
          console.log('✓ Updated successfully');
        }
      }
    }

    // Now delete the duplicates
    console.log('\nDeleting duplicate submission types...');
    const { error: deleteError } = await supabase
      .from('submission_types')
      .delete()
      .in('id', duplicates);

    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
      return;
    }

    console.log(`\n✓ Successfully deleted ${duplicates.length} duplicate entries!`);
    
    // Verify
    const { data: finalTypes, error: finalError } = await supabase
      .from('submission_types')
      .select('*')
      .order('name', { ascending: true });

    if (finalError) {
      console.error('Error verifying:', finalError);
      return;
    }

    console.log('\n✓ Final submission types:');
    finalTypes.forEach(t => {
      console.log(`  - ${t.name} (ID: ${t.id}, applicable_to: ${JSON.stringify(t.applicable_to)})`);
    });

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
fixDuplicateSubmissionTypes()
  .then(() => {
    console.log('\n✓ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
