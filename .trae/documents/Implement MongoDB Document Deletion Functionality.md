# MongoDB Document Deletion Functionality Implementation Plan

## Overview
Implement comprehensive MongoDB document deletion functionality using Mongoose ODM, including hard delete, soft delete, and transaction support.

## 1. Schema Enhancements

### 1.1 Add Soft Delete Fields
Add `deletedAt` field to all Mongoose schemas in `src/models/`:
- Content.js
- CrawlTask.js
- TaskLog.js
- User.js
- PlatformAccount.js
- HotsearchSnapshot.js
- Config.js

### 1.2 Add Soft Delete Plugin
Create a Mongoose plugin for soft delete functionality that:
- Adds `deletedAt` field with default `null`
- Implements `findOneAndDelete` and `deleteMany` hooks
- Adds methods for soft delete, restore, and find with deleted documents

## 2. Deletion Methods Implementation

### 2.1 Single Document Deletion
- `deleteById(id)`: Hard delete by ID
- `softDeleteById(id)`: Soft delete by ID
- `restoreById(id)`: Restore soft deleted document

### 2.2 Multiple Document Deletion
- `deleteByCriteria(criteria)`: Hard delete multiple documents
- `softDeleteByCriteria(criteria)`: Soft delete multiple documents
- `restoreByCriteria(criteria)`: Restore multiple soft deleted documents

### 2.3 Transaction Support
Implement transaction support for operations requiring multiple document deletions:
- Use Mongoose transactions with `session`
- Support rollback on failure
- Ensure atomicity for related document deletions

## 3. Validation and Error Handling

### 3.1 Validation Rules
- Prevent deletion of critical system documents
- Add confirmation checks for bulk deletions
- Validate query parameters and IDs

### 3.2 Error Handling
- Handle non-existent documents with proper error messages
- Handle invalid query parameters
- Handle permission issues
- Handle database connection errors

## 4. Logging Implementation

### 4.1 Delete Action Logging
Add logging for all delete operations:
- Log document ID, collection, and deletion type
- Log user performing the deletion (if applicable)
- Log deletion time and result
- Log restore operations

### 4.2 Log Levels
- Use appropriate log levels (info, warn, error)
- Include detailed information for debugging

## 5. Controller Integration

### 5.1 Add Delete Endpoints
Add API endpoints for deletion operations:
- `DELETE /api/v1/{resource}/{id}`: Hard delete
- `POST /api/v1/{resource}/{id}/soft-delete`: Soft delete
- `POST /api/v1/{resource}/{id}/restore`: Restore
- `DELETE /api/v1/{resource}/bulk`: Bulk hard delete
- `POST /api/v1/{resource}/bulk/soft-delete`: Bulk soft delete
- `POST /api/v1/{resource}/bulk/restore`: Bulk restore

### 5.2 Update Existing Controllers
Update existing controllers to use the new deletion methods:
- ContentController.js
- TaskController.js
- UserController.js (if exists)

## 6. Testing

### 6.1 Unit Tests
Create unit tests for deletion functionality:
- Test single document deletion
- Test multiple document deletion
- Test soft delete and restore
- Test error handling
- Test transaction functionality

### 6.2 Integration Tests
Test deletion endpoints with API requests:
- Test success cases
- Test error cases
- Test permission handling

## 7. Documentation

### 7.1 Method Documentation
Document all deletion methods:
- Parameters
- Return values
- Error scenarios
- Examples

### 7.2 API Documentation
Update API documentation to include delete endpoints:
- Endpoint URLs and methods
- Request parameters and body
- Response formats
- Error codes

## Implementation Steps

1. Create soft delete plugin
2. Update all Mongoose schemas with soft delete fields
3. Implement deletion methods in a new service
4. Update controllers with delete endpoints
5. Add logging
6. Add validation and error handling
7. Implement transaction support
8. Write tests
9. Update documentation

## Files to Modify

- `src/models/*.js`: Add soft delete fields
- `src/services/DeleteService.js`: New service for deletion functionality
- `src/plugins/softDeletePlugin.js`: New soft delete plugin
- `src/controllers/*.js`: Add delete endpoints
- `src/routes/*.js`: Add delete routes
- `src/utils/logger.js`: Update logging configuration

## Expected Outcomes

- Comprehensive deletion functionality with hard and soft delete options
- Proper error handling and validation
- Transaction support for multi-document operations
- Detailed logging for all delete actions
- Well-documented API endpoints and methods

This implementation will provide a robust and flexible deletion system while maintaining data integrity and preventing accidental data loss.