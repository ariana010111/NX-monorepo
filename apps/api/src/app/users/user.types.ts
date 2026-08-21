/**
 * Internal shape held by the repository — includes passwordHash, which
 * must NEVER appear in a response DTO. UserResponseDto strips it.
 */
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  roles: string[]; // role names, e.g. ['CUSTOMER'], ['SUPER_ADMIN']
}
