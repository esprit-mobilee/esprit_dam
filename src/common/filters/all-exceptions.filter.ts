import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erreur interne du serveur';

    // Format validation errors to show which fields are failing
    if (status === HttpStatus.BAD_REQUEST && typeof message === 'object') {
      if (Array.isArray(message.message)) {
        // This is a validation error from class-validator
        const validationErrors = message.message;
        const formattedErrors: Record<string, string[]> = {};
        
        validationErrors.forEach((error: string) => {
          // Parse error messages like "startDate: must be a valid ISO 8601 date string" or "startDate must be a valid ISO 8601 date string"
          const colonMatch = error.match(/^(\w+):\s*(.+)$/);
          const spaceMatch = error.match(/^(\w+)\s+(.+)$/);
          
          if (colonMatch) {
            const field = colonMatch[1];
            const errorMsg = colonMatch[2];
            if (!formattedErrors[field]) {
              formattedErrors[field] = [];
            }
            formattedErrors[field].push(errorMsg);
          } else if (spaceMatch) {
            const field = spaceMatch[1];
            const errorMsg = spaceMatch[2];
            if (!formattedErrors[field]) {
              formattedErrors[field] = [];
            }
            formattedErrors[field].push(errorMsg);
          } else {
            // If we can't parse, add to a general errors array
            if (!formattedErrors['_general']) {
              formattedErrors['_general'] = [];
            }
            formattedErrors['_general'].push(error);
          }
        });

        // Create a user-friendly message string
        const errorMessages = Object.entries(formattedErrors)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
          .join('; ');

        message = {
          ...message,
          message: errorMessages || message.message,
          errors: formattedErrors,
          details: validationErrors,
        };
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
