# MongoDB Document Deletion Functionality

This document describes the comprehensive MongoDB document deletion functionality implemented using Mongoose ODM. The implementation includes hard delete, soft delete, and transaction support for document deletion.

## Features

- **Single Document Deletion**: Delete individual documents by ID
- **Bulk Document Deletion**: Delete multiple documents based on criteria
- **Soft Delete**: Mark documents as deleted with a timestamp instead of permanent removal
- **Restore Functionality**: Restore soft deleted documents
- **Transaction Support**: Atomic operations for related document deletions
- **Comprehensive Logging**: Detailed logs for all delete actions
- **Validation**: Prevent accidental deletion of critical data
- **Error Handling**: Proper error messages for various scenarios

## API Endpoints

### Single Document Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/api/v1/mongo-delete/:collection/:id` | Hard delete a single document by ID |
| POST | `/api/v1/mongo-delete/:collection/:id/soft-delete` | Soft delete a single document by ID |
| POST | `/api/v1/mongo-delete/:collection/:id/restore` | Restore a soft deleted document by ID |

### Bulk Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/mongo-delete/:collection/delete-by-criteria` | Hard delete multiple documents by criteria |
| POST | `/api/v1/mongo-delete/:collection/soft-delete-by-criteria` | Soft delete multiple documents by criteria |
| POST | `/api/v1/mongo-delete/:collection/restore-by-criteria` | Restore multiple documents by criteria |
| POST | `/api/v1/mongo-delete/transaction` | Delete related documents in a transaction |

### Query Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mongo-delete/:collection/deleted` | Get soft deleted documents with pagination |

## Supported Collections

- `contents`: Content documents
- `crawltasks`: Crawl task documents
- `tasklogs`: Task log documents
- `users`: User documents
- `platformaccounts`: Platform account documents
- `hotsearchsnapshots`: Hotsearch snapshot documents
- `systemsettings`: System settings documents
- `platformcookies`: Platform cookie documents

## Request Parameters

### Single Document Operations

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collection` | string | Yes | Name of the collection |
| `id` | string | Yes | Document ID |
| `force` | boolean | No | Force delete even if already soft deleted (for hard delete only) |

### Bulk Operations

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collection` | string | Yes | Name of the collection |
| `criteria` | object | Yes | MongoDB query criteria for deletion |
| `allowEmptyCriteria` | boolean | No | Allow deletion with empty criteria (default: false) |

### Transaction Operations

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deletionPlan` | array | Yes | Array of deletion operations to execute in transaction |

### Deletion Plan Format

```json
[
  {
    "collection": "contents",
    "operation": "softDeleteById",
    "id": "document-id"
  },
  {
    "collection": "crawltasks",
    "operation": "deleteByCriteria",
    "criteria": { "platform": "test-platform" }
  }
]
```

## Response Format

### Success Response

```json
{
  "message": "Success message",
  "data": {
    // Deleted/updated document or result
  }
}
```

### Error Response

```json
{
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Usage Examples

### 1. Soft Delete a Document

```bash
curl -X POST http://localhost:3000/api/v1/mongo-delete/contents/60f0f0f0f0f0f0f0f0f0f0f0/soft-delete
```

Response:
```json
{
  "message": "Document soft deleted successfully",
  "data": {
    "_id": "60f0f0f0f0f0f0f0f0f0f0f0",
    "title": "Test Content",
    "deletedAt": "2023-01-01T00:00:00.000Z",
    // Other document fields
  }
}
```

### 2. Hard Delete Multiple Documents

```bash
curl -X POST http://localhost:3000/api/v1/mongo-delete/contents/delete-by-criteria \
  -H "Content-Type: application/json" \
  -d '{"criteria": {"platform": "test-platform"}}'
```

Response:
```json
{
  "message": "Successfully deleted 5 documents",
  "data": {
    "deletedCount": 5
  }
}
```

### 3. Restore a Document

```bash
curl -X POST http://localhost:3000/api/v1/mongo-delete/contents/60f0f0f0f0f0f0f0f0f0f0f0/restore
```

Response:
```json
{
  "message": "Document restored successfully",
  "data": {
    "_id": "60f0f0f0f0f0f0f0f0f0f0f0",
    "title": "Test Content",
    "deletedAt": null,
    // Other document fields
  }
}
```

### 4. Get Deleted Documents

```bash
curl -X GET http://localhost:3000/api/v1/mongo-delete/contents/deleted?page=1&page_size=10&platform=test-platform
```

Response:
```json
{
  "message": "Deleted documents retrieved successfully",
  "data": {
    "list": [
      {
        "_id": "60f0f0f0f0f0f0f0f0f0f0f0",
        "title": "Test Content",
        "deletedAt": "2023-01-01T00:00:00.000Z",
        // Other document fields
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
}
```

### 5. Transactional Deletion

```bash
curl -X POST http://localhost:3000/api/v1/mongo-delete/transaction \
  -H "Content-Type: application/json" \
  -d '{"deletionPlan": [
    {"collection": "contents", "operation": "softDeleteById", "id": "content-id"},
    {"collection": "crawltasks", "operation": "softDeleteById", "id": "task-id"}
  ]}'
```

Response:
```json
{
  "message": "Related documents deleted successfully",
  "data": {
    "success": true,
    "results": [
      // Results of individual operations
    ]
  }
}
```

## Soft Delete Mechanism

### How Soft Delete Works

1. When a document is soft deleted, a `deletedAt` timestamp is added to the document
2. By default, query methods (`find`, `findOne`, `findById`) exclude documents with a non-null `deletedAt` field
3. Use `findWithDeleted`, `findOneWithDeleted`, or `findByIdWithDeleted` to include deleted documents
4. The `deletedAt` field is indexed for efficient querying

### Soft Delete Methods

- `softDeleteById(id)`: Soft delete a document by ID
- `softDeleteByCriteria(criteria)`: Soft delete multiple documents
- `restoreById(id)`: Restore a soft deleted document
- `restoreByCriteria(criteria)`: Restore multiple documents
- `findWithDeleted(criteria)`: Find documents including deleted ones

## DeletionService API

The `DeleteService` class provides comprehensive deletion functionality that can be used directly in your code:

### Methods

#### Single Document Methods

```javascript
// Hard delete a document by ID
await DeleteService.deleteById(Model, id, options);

// Soft delete a document by ID
await DeleteService.softDeleteById(Model, id, options);

// Restore a document by ID
await DeleteService.restoreById(Model, id, options);
```

#### Bulk Methods

```javascript
// Hard delete by criteria
await DeleteService.deleteByCriteria(Model, criteria, options);

// Soft delete by criteria
await DeleteService.softDeleteByCriteria(Model, criteria, options);

// Restore by criteria
await DeleteService.restoreByCriteria(Model, criteria, options);
```

#### Transaction Methods

```javascript
// Execute operations in transaction
await DeleteService.executeInTransaction(operations, options);

// Delete related documents in transaction
await DeleteService.deleteWithRelatedDocuments(deletionPlan, options);
```

## Error Handling

The API returns appropriate HTTP status codes and error messages for various scenarios:

| Status Code | Error Message | Description |
|-------------|---------------|-------------|
| 400 | Invalid document ID | The provided ID is not a valid MongoDB ObjectId |
| 400 | Deletion criteria must be provided | No criteria specified for bulk deletion |
| 403 | Cannot delete all documents without explicit permission | Attempted to delete all documents without allowEmptyCriteria=true |
| 404 | Document not found | The document with the provided ID does not exist |
| 500 | Failed to delete document | Internal server error |
| 503 | MongoDB connection unavailable | MongoDB connection is not established |

## Logging

All delete operations are logged with detailed information:

- Document ID and collection
- Deletion type (hard/soft)
- User performing the deletion (if available)
- Timestamp
- Result (success/failure)
- Error details (if any)

## Validation Rules

- **Critical Document Protection**: Prevent deletion of system settings and admin users
- **Empty Criteria Check**: Require explicit permission to delete all documents
- **ID Validation**: Validate all document IDs before deletion
- **Existence Check**: Verify documents exist before deletion
- **Duplicate Deletion Check**: Skip already deleted documents

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection URI | mongodb://localhost:27017/videoAll |

### Model Configuration

All Mongoose models are enhanced with soft delete functionality through a plugin:

```javascript
const softDeletePlugin = require('../plugins/softDeletePlugin');
schema.plugin(softDeletePlugin);
```

## Testing

Unit tests are provided in `src/tests/MongoDelete.test.js` to verify the functionality:

```bash
npm test -- src/tests/MongoDelete.test.js
```

## Best Practices

1. **Use Soft Delete When Possible**: Prefer soft delete for recoverable data
2. **Implement Proper Authorization**: Restrict delete operations based on user roles
3. **Validate Inputs**: Always validate IDs and criteria before deletion
4. **Use Transactions for Related Data**: Ensure atomicity for related document deletions
5. **Monitor Delete Operations**: Review logs regularly for unexpected deletions
6. **Implement Backup Strategy**: Regularly back up critical data
7. **Set Retention Policies**: Define how long soft deleted data should be retained

## Security Considerations

- **Authentication**: Protect delete endpoints with proper authentication
- **Authorization**: Implement role-based access control for delete operations
- **Rate Limiting**: Prevent abuse of delete endpoints
- **Input Validation**: Sanitize all input parameters
- **Audit Logging**: Maintain detailed logs for compliance
- **Data Backup**: Regular backups to prevent data loss

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Ensure MongoDB is running and the connection URI is correct
2. **Invalid Collection Name**: Check the collection name in the endpoint
3. **Permission Denied**: Verify the user has appropriate permissions
4. **Document Not Found**: Ensure the document ID exists
5. **Transaction Failed**: Check if all operations in the transaction are valid

### Debugging

- Enable debug logging in the logger configuration
- Check MongoDB logs for database-level errors
- Review application logs for detailed error information
- Test individual operations in isolation

## Conclusion

This comprehensive MongoDB document deletion functionality provides a robust solution for managing document deletions with safety, flexibility, and reliability. The implementation follows best practices and provides clear APIs for both direct usage and RESTful endpoints.

For more information, please refer to the source code documentation or contact the development team.