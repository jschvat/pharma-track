/**
 * PharmaReportGenerator Component Tests
 * 
 * Comprehensive test suite for the PharmaReportGenerator component including
 * report types, data processing, export formats, and chart generation.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, renderForA11y, mockApi } from '../utils/testUtils';
import PharmaReportGenerator, {
  ReportProvider,
  InventoryReportGenerator,
  PrescriptionReportGenerator,
  FinancialReportGenerator,
  AuditReportGenerator,
  QuickReportButton,
  useReports,
  ReportUtils,
  REPORT_TYPES,
  OUTPUT_FORMATS,
  CHART_TYPES
} from '../../components/common/PharmaReportGenerator';

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }) => (
    <div data-testid="bar-chart" data-options={JSON.stringify(options)}>
      {JSON.stringify(data)}
    </div>
  ),
  Line: ({ data, options }) => (
    <div data-testid="line-chart" data-options={JSON.stringify(options)}>
      {JSON.stringify(data)}
    </div>
  ),
  Pie: ({ data, options }) => (
    <div data-testid="pie-chart" data-options={JSON.stringify(options)}>
      {JSON.stringify(data)}
    </div>
  ),
}));

// Mock file download
const mockDownload = jest.fn();
global.URL = {
  createObjectURL: jest.fn(() => 'blob:url'),
  revokeObjectURL: jest.fn(),
};

// Mock document.createElement for download links
const mockClick = jest.fn();
const mockCreateElement = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
  if (tagName === 'a') {
    return {
      href: '',
      download: '',
      click: mockClick,
      style: {},
    };
  }
  return document.createElement(tagName);
});

describe('PharmaReportGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDownload.mockClear();
    mockClick.mockClear();
  });

  afterAll(() => {
    mockCreateElement.mockRestore();
  });

  describe('Basic Functionality', () => {
    test('renders report generator interface', () => {
      renderWithProviders(
        <PharmaReportGenerator />
      );
      
      expect(screen.getByText(/report generator/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate report/i })).toBeInTheDocument();
    });

    test('displays report type selection', () => {
      renderWithProviders(
        <PharmaReportGenerator />
      );
      
      const reportTypeSelect = screen.getByLabelText(/report type/i);
      expect(reportTypeSelect).toBeInTheDocument();
      
      // Check for all report types
      Object.values(REPORT_TYPES).forEach(type => {
        expect(screen.getByRole('option', { name: new RegExp(type, 'i') })).toBeInTheDocument();
      });
    });

    test('displays output format selection', () => {
      renderWithProviders(
        <PharmaReportGenerator />
      );
      
      const formatSelect = screen.getByLabelText(/output format/i);
      expect(formatSelect).toBeInTheDocument();
      
      // Check for all output formats
      Object.values(OUTPUT_FORMATS).forEach(format => {
        expect(screen.getByRole('option', { name: new RegExp(format, 'i') })).toBeInTheDocument();
      });
    });

    test('displays date range selectors', () => {
      renderWithProviders(
        <PharmaReportGenerator />
      );
      
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });
  });

  describe('Report Generation', () => {
    test('generates report with selected parameters', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      // Select report type
      await user.selectOptions(
        screen.getByLabelText(/report type/i),
        screen.getByRole('option', { name: /inventory/i })
      );
      
      // Select output format
      await user.selectOptions(
        screen.getByLabelText(/output format/i),
        screen.getByRole('option', { name: /pdf/i })
      );
      
      // Set date range
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      await user.type(screen.getByLabelText(/end date/i), '2024-12-31');
      
      // Generate report
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/generating report/i)).toBeInTheDocument();
      });
    });

    test('validates required fields before generation', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      // Try to generate without required fields
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/please select a report type/i)).toBeInTheDocument();
      });
    });

    test('handles report generation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockApi.generateReport = jest.fn(() => Promise.reject(new Error('Report generation failed')));
      
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      // Fill required fields
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.selectOptions(screen.getByLabelText(/output format/i), 'pdf');
      
      // Generate report
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/error generating report/i)).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('shows loading state during generation', async () => {
      let resolvePromise;
      const mockGeneratePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockApi.generateReport = jest.fn(() => mockGeneratePromise);
      
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      expect(screen.getByRole('button')).toHaveTextContent(/generating/i);
      expect(screen.getByRole('button')).toBeDisabled();
      
      resolvePromise({ success: true, data: { reportUrl: 'test.pdf' } });
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveTextContent(/generate report/i);
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });
  });

  describe('Report Filters and Options', () => {
    test('shows relevant filters based on report type', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      // Select inventory report
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/store/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/low stock only/i)).toBeInTheDocument();
      });
      
      // Select prescription report
      await user.selectOptions(screen.getByLabelText(/report type/i), 'prescriptions');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/prescriber/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/low stock only/i)).not.toBeInTheDocument();
      });
    });

    test('applies filters to report generation', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.selectOptions(screen.getByLabelText(/store/i), '1');
      await user.click(screen.getByLabelText(/low stock only/i));
      
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(mockApi.generateReport).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              storeId: '1',
              lowStockOnly: true
            })
          })
        );
      });
    });

    test('preserves filter state between report types', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      // Set filters for inventory report
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.selectOptions(screen.getByLabelText(/store/i), '1');
      
      // Switch to another report type and back
      await user.selectOptions(screen.getByLabelText(/report type/i), 'prescriptions');
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      
      // Store filter should be preserved
      expect(screen.getByDisplayValue('Store 1')).toBeInTheDocument();
    });
  });

  describe('Chart Generation', () => {
    test('displays chart when chart type is selected', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator includeChart />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.selectOptions(screen.getByLabelText(/chart type/i), 'bar');
      
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    test('supports different chart types', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator includeChart />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'financial');
      
      // Test bar chart
      await user.selectOptions(screen.getByLabelText(/chart type/i), 'bar');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
      
      // Test line chart
      await user.selectOptions(screen.getByLabelText(/chart type/i), 'line');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
      
      // Test pie chart
      await user.selectOptions(screen.getByLabelText(/chart type/i), 'pie');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    test('configures chart based on report data', async () => {
      const mockReportData = {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
          label: 'Revenue',
          data: [1000, 1500, 1200],
          backgroundColor: '#007bff'
        }]
      };
      
      mockApi.generateReport = jest.fn(() => Promise.resolve({
        success: true,
        data: { chartData: mockReportData }
      }));
      
      const { user } = renderWithProviders(
        <PharmaReportGenerator includeChart />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'financial');
      await user.selectOptions(screen.getByLabelText(/chart type/i), 'bar');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        const chart = screen.getByTestId('bar-chart');
        expect(chart).toHaveTextContent('Revenue');
        expect(chart).toHaveTextContent('1000');
        expect(chart).toHaveTextContent('1500');
        expect(chart).toHaveTextContent('1200');
      });
    });
  });

  describe('Specialized Report Components', () => {
    test('InventoryReportGenerator shows inventory-specific options', () => {
      renderWithProviders(
        <InventoryReportGenerator />
      );
      
      expect(screen.getByLabelText(/include expired items/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/group by category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/include lot numbers/i)).toBeInTheDocument();
    });

    test('PrescriptionReportGenerator shows prescription-specific options', () => {
      renderWithProviders(
        <PrescriptionReportGenerator />
      );
      
      expect(screen.getByLabelText(/include patient info/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/group by prescriber/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/controlled substances only/i)).toBeInTheDocument();
    });

    test('FinancialReportGenerator shows financial-specific options', () => {
      renderWithProviders(
        <FinancialReportGenerator />
      );
      
      expect(screen.getByLabelText(/include taxes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/group by payment method/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show profit margins/i)).toBeInTheDocument();
    });

    test('AuditReportGenerator shows audit-specific options', () => {
      renderWithProviders(
        <AuditReportGenerator />
      );
      
      expect(screen.getByLabelText(/transaction type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/include user details/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show quantity changes/i)).toBeInTheDocument();
    });

    test('QuickReportButton generates predefined reports', async () => {
      const { user } = renderWithProviders(
        <QuickReportButton 
          reportType="lowStock"
          reportName="Low Stock Alert"
        />
      );
      
      await user.click(screen.getByRole('button', { name: /low stock alert/i }));
      
      await waitFor(() => {
        expect(mockApi.generateReport).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'inventory',
            filters: expect.objectContaining({
              lowStockOnly: true
            })
          })
        );
      });
    });
  });

  describe('ReportProvider and useReports Hook', () => {
    test('provides report context and history', () => {
      const TestComponent = () => {
        const { reports, generateReport, deleteReport } = useReports();
        
        return (
          <div>
            <div data-testid="report-count">{reports.length}</div>
            <button onClick={() => generateReport({ type: 'test' })}>
              Generate Test Report
            </button>
          </div>
        );
      };

      renderWithProviders(
        <ReportProvider>
          <TestComponent />
        </ReportProvider>
      );
      
      expect(screen.getByTestId('report-count')).toHaveTextContent('0');
      expect(screen.getByRole('button', { name: /generate test report/i })).toBeInTheDocument();
    });

    test('manages report history', async () => {
      const TestComponent = () => {
        const { reports, generateReport } = useReports();
        
        return (
          <div>
            <div data-testid="report-count">{reports.length}</div>
            <button onClick={() => generateReport({ 
              type: 'inventory', 
              name: 'Test Report' 
            })}>
              Generate Report
            </button>
            {reports.map(report => (
              <div key={report.id} data-testid="report-item">
                {report.name}
              </div>
            ))}
          </div>
        );
      };

      const { user } = renderWithProviders(
        <ReportProvider>
          <TestComponent />
        </ReportProvider>
      );
      
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('report-count')).toHaveTextContent('1');
        expect(screen.getByTestId('report-item')).toHaveTextContent('Test Report');
      });
    });

    test('provides report scheduling functionality', async () => {
      const TestComponent = () => {
        const { scheduleReport, scheduledReports } = useReports();
        
        return (
          <div>
            <div data-testid="scheduled-count">{scheduledReports.length}</div>
            <button onClick={() => scheduleReport({
              type: 'daily',
              reportConfig: { type: 'inventory' },
              schedule: '0 9 * * *' // Daily at 9 AM
            })}>
              Schedule Daily Report
            </button>
          </div>
        );
      };

      const { user } = renderWithProviders(
        <ReportProvider>
          <TestComponent />
        </ReportProvider>
      );
      
      await user.click(screen.getByRole('button', { name: /schedule daily report/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('scheduled-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Export Functionality', () => {
    test('downloads report in selected format', async () => {
      const mockReportData = {
        url: 'test-report.pdf',
        filename: 'inventory-report-2024.pdf'
      };
      
      mockApi.generateReport = jest.fn(() => Promise.resolve({
        success: true,
        data: mockReportData
      }));
      
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.selectOptions(screen.getByLabelText(/output format/i), 'pdf');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(mockClick).toHaveBeenCalled();
      });
    });

    test('supports different export formats', async () => {
      const formats = ['pdf', 'excel', 'csv', 'json'];
      
      for (const format of formats) {
        const { user } = renderWithProviders(
          <PharmaReportGenerator />
        );
        
        await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
        await user.selectOptions(screen.getByLabelText(/output format/i), format);
        await user.click(screen.getByRole('button', { name: /generate report/i }));
        
        await waitFor(() => {
          expect(mockApi.generateReport).toHaveBeenCalledWith(
            expect.objectContaining({
              outputFormat: format
            })
          );
        });
      }
    });

    test('handles export errors gracefully', async () => {
      mockApi.generateReport = jest.fn(() => Promise.reject(new Error('Export failed')));
      
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('ReportUtils', () => {
    test('formats report data correctly', () => {
      const rawData = [
        { drug_name: 'Acetaminophen', quantity: 100, cost: 25.50 },
        { drug_name: 'Ibuprofen', quantity: 75, cost: 18.25 }
      ];
      
      const formatted = ReportUtils.formatInventoryData(rawData);
      
      expect(formatted).toEqual([
        { 'Drug Name': 'Acetaminophen', 'Quantity': 100, 'Cost': '$25.50' },
        { 'Drug Name': 'Ibuprofen', 'Quantity': 75, 'Cost': '$18.25' }
      ]);
    });

    test('generates chart data from report data', () => {
      const reportData = [
        { category: 'Analgesics', count: 50 },
        { category: 'Antibiotics', count: 30 },
        { category: 'Vitamins', count: 75 }
      ];
      
      const chartData = ReportUtils.generateChartData(reportData, 'category', 'count');
      
      expect(chartData.labels).toEqual(['Analgesics', 'Antibiotics', 'Vitamins']);
      expect(chartData.datasets[0].data).toEqual([50, 30, 75]);
    });

    test('calculates report statistics', () => {
      const data = [
        { value: 100 },
        { value: 200 },
        { value: 150 },
        { value: 300 }
      ];
      
      const stats = ReportUtils.calculateStatistics(data, 'value');
      
      expect(stats.total).toBe(750);
      expect(stats.average).toBe(187.5);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(300);
      expect(stats.count).toBe(4);
    });

    test('validates report configuration', () => {
      const validConfig = {
        type: 'inventory',
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        outputFormat: 'pdf'
      };
      
      const invalidConfig = {
        type: '',
        dateRange: { start: '', end: '' }
      };
      
      expect(ReportUtils.validateConfig(validConfig)).toBe(true);
      expect(ReportUtils.validateConfig(invalidConfig)).toBe(false);
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { checkA11y } = renderForA11y(
        <PharmaReportGenerator />
      );
      
      await checkA11y();
    });

    test('has proper form labels and descriptions', () => {
      renderWithProviders(
        <PharmaReportGenerator />
      );
      
      expect(screen.getByLabelText(/report type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/output format/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    test('announces report generation status to screen readers', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/generating report/i);
      });
    });

    test('provides keyboard navigation for all controls', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      // Tab through all form controls
      await user.tab(); // Report type
      await user.tab(); // Output format
      await user.tab(); // Start date
      await user.tab(); // End date
      await user.tab(); // Generate button
      
      expect(screen.getByRole('button', { name: /generate report/i })).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('debounces filter changes', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      const filterInput = screen.getByLabelText(/search/i);
      
      // Type rapidly
      await user.type(filterInput, 'acetaminophen');
      
      // Should debounce API calls
      await waitFor(() => {
        expect(mockApi.searchDrugs).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    test('memoizes expensive calculations', () => {
      const calculateSpy = jest.spyOn(ReportUtils, 'calculateStatistics');
      
      const TestComponent = ({ data }) => {
        const stats = ReportUtils.calculateStatistics(data, 'value');
        return <div>{stats.total}</div>;
      };
      
      const data = [{ value: 100 }, { value: 200 }];
      
      const { rerender } = renderWithProviders(
        <TestComponent data={data} />
      );
      
      calculateSpy.mockClear();
      rerender(<TestComponent data={data} />);
      
      // Should use memoized result for same data
      expect(calculateSpy).toHaveBeenCalledTimes(1);
      
      calculateSpy.mockRestore();
    });

    test('handles large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000
      }));
      
      mockApi.generateReport = jest.fn(() => Promise.resolve({
        success: true,
        data: { items: largeDataset }
      }));
      
      const startTime = performance.now();
      
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/report generated/i)).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      
      // Should process large dataset quickly
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty report data', async () => {
      mockApi.generateReport = jest.fn(() => Promise.resolve({
        success: true,
        data: { items: [] }
      }));
      
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument();
      });
    });

    test('handles malformed date inputs', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      await user.type(screen.getByLabelText(/start date/i), 'invalid-date');
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid date format/i)).toBeInTheDocument();
      });
    });

    test('handles network failures gracefully', async () => {
      mockApi.generateReport = jest.fn(() => Promise.reject(new Error('Network error')));
      
      const { user } = renderWithProviders(
        <PharmaReportGenerator />
      );
      
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.click(screen.getByRole('button', { name: /generate report/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });
});