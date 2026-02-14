import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: { id?: string };
}

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: RequestWithUser): Promise<string> {
    // Use user ID if authenticated, otherwise IP
    if (req.user?.id) {
      return req.user.id;
    }
    // Get IP from various headers
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return forwardedStr.split(',')[0].trim();
    }
    return req.ip || 'unknown';
  }

  protected throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new ThrottlerException('Too many requests. Please try again later.');
  }
}
