# TPA Compliance Notifications

## Description
This script generates and sends compliance reports for Teams Practice Agreements (TPA) to project teams or administrators. It collects the latest compliance results from InfluxDB, formats them into a Markdown report, and sends notifications via email.

## Configuration Variables

- `forAdmin`: A boolean indicating whether to generate a summary for all groups (admin mode) or for a specific group.
- `courseId`: A string representing the course ID.
- `projectId`: A string representing the project ID for which the report is generated.
- `scopeManagerKey`: A string used for authentication when retrieving project scope information.

## Configuration Default

```json
{
    "forAdmin": false,
    "courseId": "showcase",
    "projectId": "showcase-GH-governify_bluejay-showcase",
    "scopeManagerKey": "bluejay-scopes-private-key",
}
```
