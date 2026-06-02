// Reporting & analytics API module (PKG_10 / UC013, FR12).
import client from './client';

const EXT = { csv: 'csv', xlsx: 'xlsx', pdf: 'pdf' };

export const reportApi = {
  list: () => client.get('/reports').then((r) => r.data),
  generate: () => client.post('/reports', {}).then((r) => r.data),
  get: (id) => client.get(`/reports/${id}`).then((r) => r.data),
  // Download a report in csv | xlsx | pdf.
  download: async (id, format = 'csv') => {
    const res = await client.get(`/reports/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${id}.${EXT[format] || 'csv'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
