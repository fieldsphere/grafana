import saveAs from 'file-saver';

import {
  type CSVConfig,
  type DataFrame,
  DataTransformerID,
  dateTime,
  dateTimeFormat,
  FieldType,
  formattedValueToString,
  getFieldDisplayName,
  type LogsModel,
  MutableDataFrame,
  toCSV,
} from '@grafana/data';
import { transformToOTLP } from '@grafana-plugins/tempo/resultTransformer';

import { transformToJaeger } from '../../../plugins/datasource/jaeger/responseTransform';
import { transformToZipkin } from '../../../plugins/datasource/zipkin/utils/transforms';

/**
 * Downloads a DataFrame as a TXT file.
 *
 * @param {(Pick<LogsModel, 'meta' | 'rows'>)} logsModel
 * @param {string} title
 */
export function downloadLogsModelAsTxt(logsModel: Pick<LogsModel, 'meta' | 'rows'>, title = '', fields: string[] = []) {
  let textToDownload = '';

  logsModel.meta?.forEach((metaItem) => {
    const string = `${metaItem.label}: ${JSON.stringify(metaItem.value)}\n`;
    textToDownload = textToDownload + string;
  });
  textToDownload = textToDownload + '\n\n';

  logsModel.rows.forEach((row) => {
    const entry = !fields.length ? row.entry : fields.map((field) => row.labels[field] ?? '').join(' ');
    const newRow = row.timeEpochMs + '\t' + dateTime(row.timeEpochMs).toISOString() + '\t' + entry + '\n';
    textToDownload = textToDownload + newRow;
  });

  const blob = new Blob([textToDownload], {
    type: 'text/plain;charset=utf-8',
  });
  const fileName = `${title ? `${title}-logs` : 'Logs'}-${dateTimeFormat(new Date())}.txt`;
  saveAs(blob, fileName);
}

/**
 * Exports a DataFrame as a CSV file.
 *
 * @param {DataFrame} dataFrame
 * @param {string} title
 * @param {CSVConfig} [csvConfig]
 * @param {DataTransformerID} [transformId=DataTransformerID.noop]
 */
export function downloadDataFrameAsCsv(
  dataFrame: DataFrame,
  title: string,
  csvConfig?: CSVConfig,
  transformId: DataTransformerID = DataTransformerID.noop,
  excelCompatibilityMode = false
) {
  let blob;

  if (excelCompatibilityMode) {
    /**
     * This compatibility mode creates a utf16le csv file that uses \t as the delimiter.
     * This is to fix an issue where excel does not recognize the BOM indicating UTF-8 when the SEP= meta data header is present.
     * Without the SEP= metadata header excel will try to use the system list separator.
     * If the CSV was created on a system where the separator was ',' it will not work on a system where the separator is ';'
     * This is common on locales where ',' is the decimal separator.
     *
     * When excel opens a utf16le csv file it will no longer try to use the system list separator, and instead use \t as the separator.
     */
    const dataFrameCsv = toCSV([dataFrame], { ...csvConfig, useExcelHeader: false, delimiter: '\t' });
    const utf16le = new Uint16Array(Array.from('\ufeff' + dataFrameCsv).map((char) => char.charCodeAt(0)));
    blob = new Blob([utf16le], {
      type: 'text/csv;charset=utf-16le',
    });
  } else {
    const dataFrameCsv = toCSV([dataFrame], csvConfig);
    blob = new Blob([dataFrameCsv], {
      type: 'text/csv;charset=utf-8',
    });
  }

  const transformation = transformId !== DataTransformerID.noop ? '-as-' + transformId.toLocaleLowerCase() : '';
  const fileName = `${title}-data${transformation}-${dateTimeFormat(new Date())}.csv`;
  saveAs(blob, fileName);
}

/**
 * Exports a DataFrame as an XLSX file.
 *
 * @param {DataFrame} dataFrame
 * @param {string} title
 * @param {DataTransformerID} [transformId=DataTransformerID.noop]
 */
export async function downloadDataFrameAsXlsx(
  dataFrame: DataFrame,
  title: string,
  transformId: DataTransformerID = DataTransformerID.noop
) {
  const XLSX = await import('xlsx');
  const headers = dataFrame.fields.map((field) => getFieldDisplayName(field, dataFrame));
  const rows: unknown[][] = [headers];
  const rowCount = dataFrame.length ?? dataFrame.fields[0]?.values.length ?? 0;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const row = dataFrame.fields.map((field) => formatXlsxCellValue(field, field.values[rowIndex]));
    rows.push(row);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, toExcelSheetName(title));

  const xlsxData = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([xlsxData], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const transformation = transformId !== DataTransformerID.noop ? '-as-' + transformId.toLocaleLowerCase() : '';
  const fileName = `${title}-data${transformation}-${dateTimeFormat(new Date())}.xlsx`;
  saveAs(blob, fileName);
}

/**
 * Downloads any object as JSON file.
 *
 * @param {unknown} json
 * @param {string} title
 */
export function downloadAsJson(json: unknown, title: string) {
  const blob = new Blob([JSON.stringify(json)], {
    type: 'application/json',
  });

  const fileName = `${title}-${dateTimeFormat(new Date())}.json`;
  saveAs(blob, fileName);
}

/**
 * Downloads a trace as json, based on the DataFrame format or OTLP as a default
 *
 * @param {DataFrame} frame
 * @param {string} title
 */
export function downloadTraceAsJson(frame: DataFrame, title: string): string {
  let traceFormat = 'otlp';
  switch (frame.meta?.custom?.traceFormat) {
    case 'jaeger': {
      let res = transformToJaeger(new MutableDataFrame(frame));
      downloadAsJson(res, title);
      traceFormat = 'jaeger';
      break;
    }
    case 'zipkin': {
      let res = transformToZipkin(new MutableDataFrame(frame));
      downloadAsJson(res, title);
      traceFormat = 'zipkin';
      break;
    }
    case 'otlp':
    default: {
      let res = transformToOTLP(new MutableDataFrame(frame));
      downloadAsJson(res, title);
      break;
    }
  }
  return traceFormat;
}

function formatXlsxCellValue(field: DataFrame['fields'][number], value: unknown): unknown {
  if (value === null || value === undefined) {
    return '';
  }

  if (field.type === FieldType.frame && typeof value === 'object' && value !== null && 'value' in value) {
    value = value.value;
  }

  if (field.type === FieldType.other && typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (field.display) {
    return formattedValueToString(field.display(value));
  }

  return value;
}

function toExcelSheetName(title: string): string {
  const fallback = 'Data';
  const cleaned = (title.trim() || fallback).replace(/[:\\/?*\[\]]/g, ' ').slice(0, 31).trim();
  return cleaned || fallback;
}
