import crowdinImport from '@crowdin/crowdin-api-client';
import { createStructuredLogger } from '../../../scripts/helpers/structuredLogger';


const structuredLogger = createStructuredLogger('.github/workflows/scripts/crowdin/create-tasks');

const TRANSLATED_CONNECTOR_DESCRIPTION = '{{tos_service_type: premium}}';
const TRANSLATE_BY_VENDOR_WORKFLOW_TYPE = 'TranslateByVendor'

// TODO Remove this type assertion when https://github.com/crowdin/crowdin-api-client-js/issues/508 is fixed
// @ts-expect-error
const crowdin = crowdinImport.default as typeof crowdinImport;

const API_TOKEN = process.env.CROWDIN_PERSONAL_TOKEN;
if (!API_TOKEN) {
  structuredLogger.error('Error: CROWDIN_PERSONAL_TOKEN environment variable is not set');
  process.exit(1);
}

const PROJECT_ID = process.env.CROWDIN_PROJECT_ID ? parseInt(process.env.CROWDIN_PROJECT_ID, 10) : undefined;
if (!PROJECT_ID) {
  structuredLogger.error('Error: CROWDIN_PROJECT_ID environment variable is not set');
  process.exit(1);
}

const credentials = {
  token: API_TOKEN,
  organization: 'grafana'
};

const { tasksApi, projectsGroupsApi, sourceFilesApi, workflowsApi } = new crowdin(credentials);

const languages = await getLanguages(PROJECT_ID);
const fileIds = await getFileIds(PROJECT_ID);
const workflowStepId = await getWorkflowStepId(PROJECT_ID);

for (const language of languages) {
  const { name, id } = language;
  await createTask(PROJECT_ID, `Translate to ${name}`, id, fileIds, workflowStepId);
}

async function getLanguages(projectId: number) {
  try {
    const project = await projectsGroupsApi.getProject(projectId);
    const languages = project.data.targetLanguages;
    structuredLogger.info('Fetched languages successfully!');
    return languages;
  } catch (error) {
    structuredLogger.error('Failed to fetch languages', error);
    if (error.response && error.response.data) {
      structuredLogger.error('Crowdin error details', error.response.data);
    }
    process.exit(1);
  }
}

async function getFileIds(projectId: number) {
  try {
    const response = await sourceFilesApi.listProjectFiles(projectId);
    const files = response.data;
    const fileIds = files.map(file => file.data.id);
    structuredLogger.info('Fetched file ids successfully!');
    return fileIds;
  } catch (error) {
    structuredLogger.error('Failed to fetch file IDs', error);
    if (error.response && error.response.data) {
      structuredLogger.error('Crowdin error details', error.response.data);
    }
    process.exit(1);
  }
}

async function getWorkflowStepId(projectId: number) {
  try {
    const response = await workflowsApi.listWorkflowSteps(projectId);
    const workflowSteps = response.data;
    const workflowStepId = workflowSteps.find(step => step.data.type === TRANSLATE_BY_VENDOR_WORKFLOW_TYPE)?.data.id;
    if (!workflowStepId) {
      throw new Error(`Workflow step with type "${TRANSLATE_BY_VENDOR_WORKFLOW_TYPE}" not found`);
    }
    structuredLogger.info('Fetched workflow step ID successfully!');
    return workflowStepId;
  } catch (error) {
    structuredLogger.error('Failed to fetch workflow step ID', error);
    if (error.response && error.response.data) {
      structuredLogger.error('Crowdin error details', error.response.data);
    }
    process.exit(1);
  }
}

async function createTask(projectId: number, title: string, languageId: string, fileIds: number[], workflowStepId: number) {
  try {
    const taskParams = {
      title,
      description: TRANSLATED_CONNECTOR_DESCRIPTION,
      languageId,
      workflowStepId,
      skipAssignedStrings: true,
      fileIds,
    };

    structuredLogger.info(`Creating Crowdin task: "${title}" for language ${languageId}`);

    const response = await tasksApi.addTask(projectId, taskParams);
    structuredLogger.info(`Task created successfully! Task ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    structuredLogger.error('Failed to create Crowdin task', error);
    if (error.response && error.response.data) {
      structuredLogger.error('Crowdin error details', error.response.data);
    }
    process.exit(1);
  }
}
