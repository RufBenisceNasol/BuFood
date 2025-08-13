@Override
public void onBackPressed() {
    // Check if the back stack has entries
    if (getSupportFragmentManager().getBackStackEntryCount() > 0) {
        // Pop the back stack
        getSupportFragmentManager().popBackStack();
    } else {
        // Default behavior (exit the app)
        super.onBackPressed();
    }
}
