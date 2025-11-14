# Requirements Document

## Introduction

The Kiroween Effect is a visual and audio enhancement feature that provides celebratory feedback when a test run completes successfully in the Test Chamber interface. The feature adds a lightning flash effect and plays an audio file, with user control via a checkbox toggle in the Test Chamber Parameters area.

## Glossary

- **Test Chamber**: The main interface area where users configure and execute prompt tests
- **Test Chamber Parameters**: The configuration section at the bottom of the Test Chamber interface containing test settings
- **Run Test**: The action that executes a prompt test against the configured model
- **Kiroween Effect**: The combined lightning flash visual effect, audio playback, and floating ghost animation triggered on successful test completion
- **Lightning Flash Effect**: A brief visual animation that simulates lightning by rapidly changing screen brightness
- **Floating Ghost Animation**: An animated PNG image that moves across the header area with a floating motion, flipping direction at the endpoints
- **Header Area**: The top section of the interface containing the "Prompt-Laboratory" title, "Ollama Connected" status, and settings gear icon
- **Success Completion**: A test run that completes without errors and returns a valid response

## Requirements

### Requirement 1

**User Story:** As a user, I want to toggle the Kiroween effect on or off, so that I can control whether celebratory effects play after successful test runs

#### Acceptance Criteria

1. THE Test Chamber Parameters SHALL display a checkbox labeled "Kiroween effect"
2. THE checkbox SHALL be positioned at the bottom of the Test Chamber Parameters area
3. WHEN the user clicks the checkbox, THE Test Chamber Parameters SHALL toggle the Kiroween effect state between enabled and disabled
4. THE Test Chamber Parameters SHALL persist the Kiroween effect preference across browser sessions
5. THE checkbox SHALL default to unchecked (disabled) state on first use

### Requirement 2

**User Story:** As a user, I want to see a lightning flash effect when my test completes successfully, so that I receive immediate visual feedback on success

#### Acceptance Criteria

1. WHEN a test run completes successfully, IF the Kiroween effect is enabled, THEN THE Test Chamber SHALL trigger a lightning flash animation
2. THE lightning flash animation SHALL consist of rapid brightness changes that simulate lightning
3. THE lightning flash animation SHALL complete within 1 second plus or minus 0.2 seconds
4. THE lightning flash animation SHALL not interfere with the display of test results
5. WHEN a test run fails or returns an error, THE Test Chamber SHALL not trigger the lightning flash effect

### Requirement 3

**User Story:** As a user, I want to hear an audio effect when my test completes successfully, so that I receive immediate auditory feedback on success

#### Acceptance Criteria

1. WHEN a test run completes successfully, IF the Kiroween effect is enabled, THEN THE Test Chamber SHALL play an audio file
2. THE audio playback SHALL use a WAV format audio file
3. THE audio playback SHALL start simultaneously with the lightning flash effect
4. THE audio playback SHALL respect the user's system volume settings
5. WHEN a test run fails or returns an error, THE Test Chamber SHALL not play the audio effect

### Requirement 4

**User Story:** As a user, I want the Kiroween effect to only trigger on successful completions, so that I can distinguish between success and failure outcomes

#### Acceptance Criteria

1. WHEN a test run completes with a valid response, THE Test Chamber SHALL classify the completion as successful
2. WHEN a test run returns an error response, THE Test Chamber SHALL classify the completion as failed
3. WHEN a test run times out, THE Test Chamber SHALL classify the completion as failed
4. IF the Kiroween effect is enabled, THE Test Chamber SHALL trigger effects only for successful completions
5. THE Test Chamber SHALL not trigger effects for failed or error completions regardless of the Kiroween effect setting

### Requirement 5

**User Story:** As a user, I want to see a floating ghost animation move across the header when the Kiroween effect plays, so that I receive additional visual delight during successful test completion

#### Acceptance Criteria

1. WHEN the Kiroween effect triggers, THE Test Chamber SHALL display a floating ghost animation using the kiro_monster_leftfacing.png image
2. THE floating ghost animation SHALL start at the right edge of the "Prompt-Laboratory" title text
3. THE ghost image SHALL be horizontally flipped to face right at animation start
4. THE ghost animation SHALL move rightward across the header in front of the "Ollama Connected" status text
5. WHEN the ghost reaches the settings gear icon, THE Test Chamber SHALL horizontally flip the ghost image to face left
6. THE ghost animation SHALL move leftward back toward the "Prompt-Laboratory" title behind the "Ollama Connected" status text
7. WHEN the ghost completes its leftward journey, THE Test Chamber SHALL fade out the ghost image over 0.5 seconds plus or minus 0.1 seconds
8. THE floating ghost animation SHALL complete within 4 seconds plus or minus 0.5 seconds
9. THE floating ghost animation SHALL use a smooth floating motion effect
10. THE floating ghost animation SHALL not interfere with header functionality or clickable elements
