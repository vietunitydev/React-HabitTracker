This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.js` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# ✅ Clean Architecture Refactoring Checklist

Print this page and check off items as you complete them!

---

## 📋 Phase 1: Setup (1-2 days)

### Preparation
- [ ] Create backup branch
- [ ] Commit current code
- [ ] Read REFACTORING_GUIDE.md
- [ ] Review refactored-example code

### Folder Structure
- [ ] Create `core/` folders
- [ ] Create `features/` folders
- [ ] Create `shared/` folders
- [ ] Create `utils/` folder
- [ ] Create `config/` folder
- [ ] Setup path aliases (optional)

### Config Files
- [ ] Create `config/constants.js`
- [ ] Create `config/theme.js`
- [ ] Test imports work
- [ ] **Commit:** "Phase 1: Create structure"

---

## 🔧 Phase 2: Extract Utilities (2-3 days)

### Date Helpers
- [ ] Create `utils/dateHelpers.js`
- [ ] Copy `formatDateLocal`
- [ ] Copy `isToday`, `isYesterday`
- [ ] Copy `getWeekDays`
- [ ] Copy `formatTime`
- [ ] Copy `parseTimeToSeconds`

### Update Imports
- [ ] Update `HomeScreen.js`
- [ ] Update `AllHabitsScreen.js`
- [ ] Update `StatsScreen.js`
- [ ] Update `HabitDetailScreen.js`
- [ ] Update `NoteScreen.js`
- [ ] Update `AllNotePage.js`

### Validators
- [ ] Create `utils/validators.js`
- [ ] Add `validateHabitName`
- [ ] Add `validateCompletionTime`
- [ ] Test validations
- [ ] **Commit:** "Phase 2: Extract utilities"

---

## 🎨 Phase 3: Extract Theme (3-4 days)

### Create ThemeContext
- [ ] Create `core/contexts/ThemeContext.js`
- [ ] Copy theme logic from HabitContext
- [ ] Create `useTheme` hook
- [ ] Test theme switching

### Update HabitContext
- [ ] Remove theme state
- [ ] Remove theme object
- [ ] Remove toggleTheme function
- [ ] Remove theme from Provider value

### Update App.js
- [ ] Import ThemeProvider
- [ ] Wrap app with ThemeProvider
- [ ] Test app loads

### Update All Files
- [ ] Update `HomeScreen.js`
- [ ] Update `AllHabitsScreen.js`
- [ ] Update `StatsScreen.js`
- [ ] Update `HabitDetailScreen.js`
- [ ] Update `CreateHabitScreen.js`
- [ ] Update `SettingsScreen.js`
- [ ] Update `ChooseIconImage.js`
- [ ] Update `FilterScreen.js`
- [ ] Update `NoteScreen.js`
- [ ] Update `AllNotePage.js`
- [ ] Update `ComingSoonDialog.js`
- [ ] Update `SnoozeDialog.js`

### Testing
- [ ] Test theme switching
- [ ] Test dark mode
- [ ] Test light mode
- [ ] Test system mode
- [ ] **Commit:** "Phase 3: Extract ThemeContext"

---

## 💾 Phase 4: Storage Service (2-3 days)

### Create Service
- [ ] Create `core/services/StorageService.js`
- [ ] Add generic methods (get, set, remove)
- [ ] Add habit-specific methods
- [ ] Add timer-specific methods
- [ ] Add theme methods

### Update HabitContext
- [ ] Import StorageService
- [ ] Replace AsyncStorage.getItem
- [ ] Replace AsyncStorage.setItem
- [ ] Test data persistence

### Testing
- [ ] Test habit save/load
- [ ] Test timer save/load
- [ ] Test theme save/load
- [ ] **Commit:** "Phase 4: Create StorageService"

---

## 🧩 Phase 5: UI Components (4-5 days)

### Button Component
- [ ] Create `shared/components/ui/Button.js`
- [ ] Add variants (primary, secondary, outline, text, danger)
- [ ] Add sizes (small, medium, large)
- [ ] Add loading state
- [ ] Add icon support
- [ ] Test all variants

### Card Component
- [ ] Create `shared/components/ui/Card.js`
- [ ] Add variants (default, outlined, filled)
- [ ] Add elevation support
- [ ] Test touchable/non-touchable

### Input Component
- [ ] Create `shared/components/ui/Input.js`
- [ ] Add label support
- [ ] Add error support
- [ ] Add placeholder
- [ ] Test input validation

### Replace in Screens
- [ ] Replace buttons in `HomeScreen`
- [ ] Replace buttons in `AllHabitsScreen`
- [ ] Replace buttons in `CreateHabitScreen`
- [ ] Replace buttons in `SettingsScreen`
- [ ] Replace buttons in other screens

### Testing
- [ ] Test all button variants
- [ ] Test card interactions
- [ ] Test input fields
- [ ] **Commit:** "Phase 5: Create UI components"

---

## 🎣 Phase 6: Custom Hooks (3-4 days)

### useHabitCompletion Hook
- [ ] Create `features/habits/hooks/useHabitCompletion.js`
- [ ] Add completion status calculation
- [ ] Add toggle function
- [ ] Test hook

### useHabitTimer Hook
- [ ] Create `features/habits/hooks/useHabitTimer.js`
- [ ] Add timer state management
- [ ] Add formatted time
- [ ] Add progress calculation
- [ ] Test hook

### Update Components
- [ ] Update `HomeScreen` to use hooks
- [ ] Update `HabitDetailScreen` to use hooks
- [ ] Update `AllHabitsScreen` to use hooks
- [ ] Clean up inline logic

### Testing
- [ ] Test completion toggle
- [ ] Test timer start/pause/reset
- [ ] Test progress calculations
- [ ] **Commit:** "Phase 6: Extract custom hooks"

---

## 🎯 Phase 7: Feature Components (5-6 days)

### HabitCard Component
- [ ] Create `features/habits/components/HabitCard.js`
- [ ] Use useHabitCompletion hook
- [ ] Add icon display
- [ ] Add progress bar
- [ ] Test component

### WeekCalendar Component
- [ ] Create `features/habits/components/WeekCalendar.js`
- [ ] Use getWeekDays utility
- [ ] Highlight today
- [ ] Test component

### ProgressCircle Component
- [ ] Create `features/habits/components/ProgressCircle.js`
- [ ] Add SVG circle
- [ ] Add progress animation
- [ ] Test component

### ProgressCard Component
- [ ] Create `features/habits/components/ProgressCard.js`
- [ ] Use ProgressCircle
- [ ] Add stats display
- [ ] Test component

### Update Screens
- [ ] Update `HomeScreen` with new components
- [ ] Update `AllHabitsScreen` with HabitCard
- [ ] Update `StatsScreen` with components
- [ ] Remove inline components

### Testing
- [ ] Test HabitCard interactions
- [ ] Test WeekCalendar display
- [ ] Test ProgressCircle accuracy
- [ ] Test ProgressCard stats
- [ ] **Commit:** "Phase 7: Extract feature components"

---

## 🧪 Phase 8: Testing & Polish (3-4 days)

### Functionality Testing
- [ ] Test habit creation
- [ ] Test habit editing
- [ ] Test habit deletion
- [ ] Test habit completion
- [ ] Test timer functions
- [ ] Test note creation
- [ ] Test note editing
- [ ] Test note deletion
- [ ] Test theme switching
- [ ] Test stats display

### Performance Testing
- [ ] Check for unnecessary re-renders
- [ ] Add React.memo where needed
- [ ] Optimize expensive calculations
- [ ] Test smooth scrolling
- [ ] Test app startup time

### Code Quality
- [ ] Remove console.logs
- [ ] Remove commented code
- [ ] Fix ESLint warnings
- [ ] Add JSDoc comments
- [ ] Format code consistently

### Documentation
- [ ] Update README.md
- [ ] Document new structure
- [ ] Add setup instructions
- [ ] Create CHANGELOG.md

### Final Testing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test dark mode thoroughly
- [ ] Test light mode thoroughly
- [ ] **Commit:** "Phase 8: Testing and optimization"

---

## 🎉 Final Steps

### Pre-Merge
- [ ] Review all commits
- [ ] Squash if needed
- [ ] Write merge commit message
- [ ] Update version number

### Merge
- [ ] Merge to main branch
- [ ] Push to remote
- [ ] Tag release
- [ ] Deploy to production

### Post-Merge
- [ ] Monitor for issues
- [ ] Collect team feedback
- [ ] Document lessons learned
- [ ] Plan next improvements

---

## 📊 Progress Summary

**Started:** ___/___/______

**Completed Phases:**
- [ ] Phase 1: Setup
- [ ] Phase 2: Utilities
- [ ] Phase 3: Theme
- [ ] Phase 4: Storage
- [ ] Phase 5: UI Components
- [ ] Phase 6: Custom Hooks
- [ ] Phase 7: Feature Components
- [ ] Phase 8: Testing & Polish

**Completed:** ___/___/______

**Total Days:** ______

---

## 💡 Notes & Issues

### Blockers:
```
1. 
2. 
3. 
```

### Questions:
```
1. 
2. 
3. 
```

### Improvements:
```
1. 
2. 
3. 
```

---

## 🏆 Completion Certificate

```
┌─────────────────────────────────────────────┐
│                                             │
│      🎉 CLEAN ARCHITECTURE ACHIEVED! 🎉      │
│                                             │
│   Congratulations on refactoring your app   │
│          to Clean Architecture!             │
│                                             │
│   Completed by: _____________________       │
│   Date: ___/___/______                      │
│                                             │
│   Your code is now:                         │
│   ✓ More maintainable                       │
│   ✓ More scalable                           │
│   ✓ More testable                           │
│   ✓ More performant                         │
│                                             │
│   Keep up the great work! 🚀                │
│                                             │
└─────────────────────────────────────────────┘
```

---

**Print this page and pin it to your workspace!**
**Check off items as you complete them!**
**You got this! 💪**