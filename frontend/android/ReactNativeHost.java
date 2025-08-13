@Override
public void invokeDefaultOnBackPressed() {
    // Pass the back button event to React Native
    if (getReactInstanceManager().onBackPressed()) {
        return;
    }
    super.invokeDefaultOnBackPressed();
}
