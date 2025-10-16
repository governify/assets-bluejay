# Update Class TPA

## Description
This script updates the Teams Practice Agreement (TPA) for all projects in a given course. It retrieves the course information and the TPA template, customizes the template for each project, and updates the agreement in the registry service.

## Configuration Variables

- `templateId`: A string representing the ID of the TPA template to use.
- `courseId`: A string representing the course ID whose projects' TPAs will be updated.
- `scopeManagerKey`: A string used for authentication when retrieving course scope information.

## Configuration Default

```json
{
  "templateId": "template-UCLM-ISII-2526-v1.0.0",
  "courseId": "showcase",
  "scopeManagerKey": "bluejay-scopes-private-key"
}
```
