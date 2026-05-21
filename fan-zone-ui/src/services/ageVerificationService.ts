export interface AgeVerificationRequest {
  day: number;
  month: number;
  year: number;
}

export interface AgeVerificationResponse {
  isVerified: boolean;
  reason?: string;
}

function isValidDate(day: number, month: number, year: number): boolean {
  const dob = new Date(year, month - 1, day);
  return dob.getFullYear() === year && dob.getMonth() === month - 1 && dob.getDate() === day;
}

function isAtLeastAge(dob: Date, years: number): boolean {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= years;
}

export async function verifyAgeWithApi(payload: AgeVerificationRequest): Promise<AgeVerificationResponse> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const { day, month, year } = payload;

  if (!isValidDate(day, month, year)) {
    return { isVerified: false, reason: 'Enter a valid date of birth' };
  }

  const dob = new Date(year, month - 1, day);

  if (dob.getTime() > Date.now()) {
    return { isVerified: false, reason: 'Date of birth cannot be in the future' };
  }

  if (!isAtLeastAge(dob, 18)) {
    return { isVerified: false, reason: 'You must be 18 or older to access this content' };
  }

  return { isVerified: true };
}
