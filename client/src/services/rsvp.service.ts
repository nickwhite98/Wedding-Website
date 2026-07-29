const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface SearchInvitation {
  id: number;
  guests: { id: number; firstName: string; lastName: string }[];
}

export interface VerifiedGuest {
  id: number;
  firstName: string;
  lastName: string;
  plusOne: boolean;
  dietaryRestrictions: string | null;
  hasResponded: boolean;
}

export interface VerifiedInvitation {
  id: number;
  guests: VerifiedGuest[];
  alreadyResponded: boolean;
}

export interface EditGuest {
  id: number;
  firstName: string;
  lastName: string;
  plusOne: boolean;
  isPlusOne: boolean;
  plusOneForGuestId: number | null;
  dietaryRestrictions: string | null;
  isAttending: boolean | null;
}

export interface EditInvitation {
  id: number;
  pastDeadline: boolean;
  stayingAtHotel: boolean | null;
  usingShuttle: boolean | null;
  guests: EditGuest[];
}

export interface GuestResponsePayload {
  guestId: number;
  isAttending: boolean;
  dietaryRestrictions?: string;
}

export interface PlusOnePayload {
  hostGuestId: number;
  firstName: string;
  lastName: string;
  isAttending: boolean;
  dietaryRestrictions?: string;
}

export interface SubmitPayload {
  invitationId: number;
  zip: string;
  /** Required when anyone in the party is attending; omitted for all-declining parties. */
  email?: string;
  responses: GuestResponsePayload[];
  plusOnes: PlusOnePayload[];
  stayingAtHotel?: boolean | null;
  usingShuttle?: boolean | null;
  website?: string;
}

export class RsvpApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch {
    throw new RsvpApiError(
      "We couldn't reach the server. Check your internet connection and try again.",
      0,
    );
  }

  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // non-JSON response (e.g., server error page); keep body empty
  }

  if (!res.ok) {
    const message =
      (typeof body?.message === "string" && body.message) ||
      `Request failed (${res.status})`;
    throw new RsvpApiError(message, res.status);
  }
  return body as T;
}

export const rsvpApi = {
  async search(q: string): Promise<SearchInvitation[]> {
    const r = await request<{ success: boolean; data: SearchInvitation[] }>(
      `/rsvp/search?q=${encodeURIComponent(q)}`,
    );
    return r.data;
  },

  async verifyZip(
    invitationId: number,
    zip: string,
  ): Promise<VerifiedInvitation> {
    const r = await request<{ success: boolean; data: VerifiedInvitation }>(
      `/rsvp/verify-zip`,
      {
        method: "POST",
        body: JSON.stringify({ invitationId, zip }),
      },
    );
    return r.data;
  },

  async submit(payload: SubmitPayload): Promise<{ invitationId: number }> {
    const r = await request<{
      success: boolean;
      data: { invitationId: number };
    }>(`/rsvp/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return r.data;
  },

  async getByToken(token: string): Promise<EditInvitation> {
    const r = await request<{ success: boolean; data: EditInvitation }>(
      `/rsvp/edit?token=${encodeURIComponent(token)}`,
    );
    return r.data;
  },

  async updateByToken(
    token: string,
    responses: GuestResponsePayload[],
    plusOnes: PlusOnePayload[],
    stayingAtHotel?: boolean | null,
    usingShuttle?: boolean | null,
  ): Promise<void> {
    await request(`/rsvp/edit`, {
      method: "PUT",
      body: JSON.stringify({
        token,
        responses,
        plusOnes,
        stayingAtHotel,
        usingShuttle,
      }),
    });
  },
};

export const CONTACT_EMAIL = "kathrynnickwhite@gmail.com";

export const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut allergy",
  "Shellfish allergy",
  "Kosher",
  "Halal",
] as const;
