/**
 * Gera um link único de sala Jitsi Meet para uma sessão.
 * Não requer credenciais nem API — a sala existe ao ser acessada.
 */
export function meetingUrlForBooking(bookingId: string): string {
  const room = `MentoriaDeDonos-${bookingId}`;
  return `https://meet.jit.si/${room}`;
}
