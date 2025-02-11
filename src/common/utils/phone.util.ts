export function formatPhoneNumber(phone: string): string {
  let formattedPhone = phone.replace(/\D/g, '');

  if (formattedPhone.startsWith('55') && formattedPhone.length === 12) {
    formattedPhone = formattedPhone.slice(0, 4) + '9' + formattedPhone.slice(4);
  }

  return formattedPhone;
}
