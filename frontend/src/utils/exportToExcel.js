import * as XLSX from 'xlsx';

/**
 * Export registrations to Excel file
 * @param {Array} registrations - Array of registration objects
 * @param {String} eventName - Name of the event
 * @param {String} eventType - Type of event (bazaar, trip, workshop, gym)
 */
export const exportRegistrationsToExcel = (registrations, eventName, eventType) => {
  if (!registrations || registrations.length === 0) {
    alert('No registrations to export');
    return;
  }

  // Prepare data for Excel
  const excelData = registrations.map((reg, index) => ({
    'No.': index + 1,
    'Name': reg.name || reg.userName || '-',
    'Email': reg.email || reg.userEmail || '-',
    'User ID': reg.userId || reg.user?._id || '-',
    'User Type': reg.userType || reg.user?.role || '-',
    'Registration Date': reg.registrationDate 
      ? new Date(reg.registrationDate).toLocaleString() 
      : reg.createdAt 
      ? new Date(reg.createdAt).toLocaleString() 
      : '-',
    'Status': reg.status || 'registered'
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

  // Set column widths
  const columnWidths = [
    { wch: 5 },   // No.
    { wch: 25 },  // Name
    { wch: 30 },  // Email
    { wch: 15 },  // User ID
    { wch: 12 },  // User Type
    { wch: 20 },  // Registration Date
    { wch: 12 }   // Status
  ];
  worksheet['!cols'] = columnWidths;

  // Generate filename
  const sanitizedEventName = eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `${sanitizedEventName}_registrations_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, filename);
};

