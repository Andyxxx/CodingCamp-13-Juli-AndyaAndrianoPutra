# Requirements Document

## Introduction

The New Tab Dashboard is a browser-based single-page application built with HTML, CSS, and Vanilla JavaScript. It replaces the default new tab page with a personal productivity hub featuring a live clock and greeting, a Pomodoro focus timer, a to-do list, and quick-access links. All user data is persisted in Browser Local Storage with no backend server required. The application must load quickly and work across modern browsers (Chrome, Firefox, Edge, Safari).

Selected challenges implemented: Light/Dark mode, Custom name in greeting, Change Pomodoro time, Prevent duplicate tasks, and Sort tasks.

---

## Glossary

- **Dashboard**: The single-page HTML application that acts as the user's browser new tab page.
- **Greeting_Widget**: The UI section that displays the current time, date, and a time-based greeting message.
- **Timer**: The Pomodoro focus timer component within the Dashboard.
- **Task_Manager**: The to-do list component within the Dashboard.
- **Task**: A single to-do item consisting of text, a completion status, and a creation timestamp.
- **Link_Manager**: The quick-links component within the Dashboard.
- **Quick_Link**: A saved URL entry consisting of a label and a URL string.
- **Local_Storage**: The browser's `localStorage` API used to persist all user data.
- **Theme**: The visual color scheme of the Dashboard, either "light" or "dark".
- **User_Name**: A custom display name provided by the user, stored in Local_Storage and shown in the greeting.
- **Pomodoro_Duration**: The configurable work-session length for the Timer, measured in minutes.
- **Duplicate_Task**: A Task whose text content, after trimming whitespace and case-normalizing, matches an existing Task in the Task_Manager.

---

## Requirements

### Requirement 1: Live Clock and Date Display

**User Story:** As a user, I want to see the current time and date on my dashboard, so that I always have immediate awareness of the current moment without switching tabs.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in HH:MM:SS format, updated every second.
2. THE Greeting_Widget SHALL display the current local date in a human-readable format including the full weekday name, day, month name, and year (e.g., "Thursday, 17 July 2026").
3. WHEN the Dashboard page loads, THE Greeting_Widget SHALL render the correct time and date within 1 second.

---

### Requirement 2: Time-Based Greeting

**User Story:** As a user, I want to see a greeting that changes based on the time of day, so that the dashboard feels personal and contextually relevant.

#### Acceptance Criteria

1. WHEN the local hour is between 05:00 and 11:59 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Morning".
2. WHEN the local hour is between 12:00 and 17:59 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Afternoon".
3. WHEN the local hour is between 18:00 and 21:59 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Evening".
4. WHEN the local hour is between 22:00 and 04:59 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Night".
5. WHEN a User_Name is stored in Local_Storage, THE Greeting_Widget SHALL append the User_Name to the greeting message (e.g., "Good Morning, Alex").
6. WHEN no User_Name is stored in Local_Storage, THE Greeting_Widget SHALL display the greeting without a name suffix.

---

### Requirement 3: Custom Name Setting

**User Story:** As a user, I want to set my own name for the greeting, so that the dashboard feels personalized to me.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a UI control that allows the user to enter and save a custom User_Name.
2. WHEN the user submits a non-empty User_Name, THE Dashboard SHALL store the User_Name in Local_Storage under a defined key.
3. WHEN the user submits an empty or whitespace-only string as a User_Name, THE Dashboard SHALL remove any existing User_Name from Local_Storage and display the greeting without a name suffix.
4. WHEN the Dashboard loads, THE Greeting_Widget SHALL retrieve the User_Name from Local_Storage and display it in the greeting without requiring user interaction.

---

### Requirement 4: Pomodoro Focus Timer

**User Story:** As a user, I want a Pomodoro timer on my dashboard, so that I can manage focused work sessions without needing a separate application.

#### Acceptance Criteria

1. THE Timer SHALL display the remaining time in MM:SS format.
2. WHEN the Dashboard loads, THE Timer SHALL initialize to the current Pomodoro_Duration value stored in Local_Storage, or default to 25 minutes if no value is stored.
3. WHEN the user activates the Start control, THE Timer SHALL begin counting down one second per real-world second.
4. WHEN the user activates the Stop control while the Timer is running, THE Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Reset control, THE Timer SHALL stop the countdown and restore the display to the full Pomodoro_Duration value.
6. WHEN the Timer countdown reaches 00:00, THE Timer SHALL stop automatically and emit an audible or visual alert to notify the user that the session has ended.
7. WHILE the Timer is running, THE Timer SHALL disable the Start control and enable the Stop and Reset controls.
8. WHILE the Timer is stopped or paused, THE Timer SHALL enable the Start control and disable the Stop control.

---

### Requirement 5: Configurable Pomodoro Duration

**User Story:** As a user, I want to change the Pomodoro timer duration, so that I can adapt the focus session length to my personal workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a UI control that allows the user to set the Pomodoro_Duration to any integer value between 1 and 120 minutes (inclusive).
2. WHEN the user saves a new Pomodoro_Duration, THE Dashboard SHALL store the value in Local_Storage and reset the Timer display to the new duration.
3. IF the user submits a Pomodoro_Duration outside the range of 1 to 120 minutes, THEN THE Dashboard SHALL display a validation error message and reject the new value.
4. WHEN the Dashboard loads, THE Timer SHALL read the Pomodoro_Duration from Local_Storage to initialize the timer display.

---

### Requirement 6: To-Do List — Add Tasks

**User Story:** As a user, I want to add tasks to a list, so that I can track what I need to accomplish during my work session.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a text input field and a submit control for entering new Tasks.
2. WHEN the user submits a non-empty task text, THE Task_Manager SHALL add a new Task to the list, assign it a unique identifier and creation timestamp, and save the updated list to Local_Storage.
3. IF the user submits an empty or whitespace-only string as task text, THEN THE Task_Manager SHALL display a validation error message and not add a Task to the list.
4. IF the submitted task text, after trimming whitespace and converting to lowercase, matches the text of an existing incomplete Task (Duplicate_Task), THEN THE Task_Manager SHALL display a duplicate warning message and not add the Task.
5. WHEN the Dashboard loads, THE Task_Manager SHALL retrieve all Tasks from Local_Storage and render them in the list without requiring user interaction.

---

### Requirement 7: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit existing tasks, so that I can correct mistakes or update task descriptions.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an Edit control for each Task in the list.
2. WHEN the user activates the Edit control for a Task, THE Task_Manager SHALL replace the Task's text display with an editable input field pre-populated with the current task text.
3. WHEN the user confirms an edit with non-empty text, THE Task_Manager SHALL update the Task's text in the list and in Local_Storage.
4. IF the user confirms an edit with empty or whitespace-only text, THEN THE Task_Manager SHALL display a validation error and retain the original task text.
5. IF the edited task text, after trimming whitespace and converting to lowercase, matches the text of a different existing incomplete Task, THEN THE Task_Manager SHALL display a duplicate warning and reject the edit.
6. WHEN the user cancels an edit, THE Task_Manager SHALL restore the original task text display without modifying Local_Storage.

---

### Requirement 8: To-Do List — Mark Tasks as Done

**User Story:** As a user, I want to mark tasks as done, so that I can track my progress and visually distinguish completed work.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a completion toggle control (e.g., checkbox) for each Task.
2. WHEN the user toggles the completion control on an incomplete Task, THE Task_Manager SHALL set the Task's status to "done", apply a visual completion style (e.g., strikethrough), and save the updated state to Local_Storage.
3. WHEN the user toggles the completion control on a completed Task, THE Task_Manager SHALL set the Task's status back to "incomplete", remove the visual completion style, and save the updated state to Local_Storage.

---

### Requirement 9: To-Do List — Delete Tasks

**User Story:** As a user, I want to delete tasks, so that I can remove items that are no longer relevant.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a Delete control for each Task in the list.
2. WHEN the user activates the Delete control for a Task, THE Task_Manager SHALL remove the Task from the list and from Local_Storage.

---

### Requirement 10: To-Do List — Sort Tasks

**User Story:** As a user, I want to sort my task list, so that I can organize tasks in a way that matches my workflow.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a sort control offering at minimum the following sort modes: "Default (by creation time)", "Alphabetical (A–Z)", "Alphabetical (Z–A)", and "Completed last".
2. WHEN the user selects a sort mode, THE Task_Manager SHALL re-render the task list in the specified order without modifying the stored Task data in Local_Storage.
3. WHEN the Dashboard loads, THE Task_Manager SHALL render Tasks in the "Default (by creation time)" order unless a previously selected sort mode is stored in Local_Storage.

---

### Requirement 11: Quick Links — Add and Display

**User Story:** As a user, I want to add quick-access links to my favorite websites, so that I can navigate to them instantly from my new tab page.

#### Acceptance Criteria

1. THE Link_Manager SHALL provide input fields for a link label and a URL, and a submit control to save a new Quick_Link.
2. WHEN the user submits a Quick_Link with a non-empty label and a valid URL, THE Link_Manager SHALL add the Quick_Link to the list, save it to Local_Storage, and render it as a clickable button or card.
3. IF the user submits a Quick_Link with an empty label or an invalid URL, THEN THE Link_Manager SHALL display a validation error message and not save the Quick_Link.
4. WHEN the user activates a Quick_Link button, THE Dashboard SHALL open the saved URL in a new browser tab.
5. WHEN the Dashboard loads, THE Link_Manager SHALL retrieve all Quick_Links from Local_Storage and render them without requiring user interaction.

---

### Requirement 12: Quick Links — Delete

**User Story:** As a user, I want to remove quick links, so that I can keep the link list relevant and uncluttered.

#### Acceptance Criteria

1. THE Link_Manager SHALL provide a Delete control for each Quick_Link.
2. WHEN the user activates the Delete control for a Quick_Link, THE Link_Manager SHALL remove the Quick_Link from the list and from Local_Storage.

---

### Requirement 13: Light / Dark Mode

**User Story:** As a user, I want to toggle between light and dark themes, so that the dashboard is comfortable to use in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme toggle control that switches between "light" and "dark" modes.
2. WHEN the user activates the Theme toggle, THE Dashboard SHALL apply the selected Theme to all visual components and save the Theme preference to Local_Storage.
3. WHEN the Dashboard loads, THE Dashboard SHALL retrieve the Theme preference from Local_Storage and apply it before the first render, preventing a flash of the unselected theme.
4. WHEN no Theme preference is stored in Local_Storage, THE Dashboard SHALL apply the "light" Theme as the default.

---

### Requirement 14: Data Persistence

**User Story:** As a user, I want my tasks, links, settings, and preferences to be saved automatically, so that my data is still present the next time I open a new tab.

#### Acceptance Criteria

1. THE Dashboard SHALL persist all Tasks, Quick_Links, Pomodoro_Duration, User_Name, and Theme preference to Local_Storage whenever any of these values change.
2. WHEN the Dashboard loads, THE Dashboard SHALL restore all persisted data from Local_Storage and render the UI to reflect the saved state.
3. IF Local_Storage is unavailable or access throws an error, THEN THE Dashboard SHALL display a non-blocking warning message informing the user that data will not be saved in the current session.

---

### Requirement 15: Cross-Browser Compatibility and Performance

**User Story:** As a user opening a new tab, I want the dashboard to load instantly and work in my browser, so that it never slows down my browsing workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL be fully functional in the latest stable versions of Chrome, Firefox, Edge, and Safari using only standard HTML5, CSS3, and ES6+ JavaScript APIs.
2. THE Dashboard SHALL complete its initial render and display all widgets within 2 seconds on a standard desktop connection.
3. THE Dashboard SHALL use only a single CSS file located in the `css/` directory and a single JavaScript file located in the `js/` directory.
4. THE Dashboard SHALL be responsive and usable on viewport widths from 320px to 2560px without horizontal scrolling.
