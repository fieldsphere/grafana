import crowdinImport from '@crowdin/crowdin-api-client';
import { logCrowdinError, logCrowdinInfo } from './logging';
const TRANSLATED_CONNECTOR_DESCRIPTION = '{{tos_service_type: premium}}';
const TRANSLATE_BY_VENDOR_WORKFLOW_TYPE = 'TranslateByVendor'

// TODO Remove this type assertion when https://github.com/crowdin/crowdin-api-client-js/issues/508 is fixed
// @ts-expect-error
const crowdin = crowdinImport.default as typeof crowdinImport;

const API_TOKEN = process.env.CROWDIN_PERSONAL_TOKEN;
if (!API_TOKEN) {
  logCrowdinError('CROWDIN_PERSONAL_TOKEN environment variable is not set', {
    operation: 'bootstrap'
  });
  process.exit(1);
}

const PROJECT_ID = process.env.CROWDIN_PROJECT_ID ? parseInt(process.env.CROWDIN_PROJECT_ID, 10) : undefined;
if (!PROJECT_ID) {
  logCrowdinError('CROWDIN_PROJECT_ID environment variable is not set', {
    operation: 'bootstrap'
  });
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
    logCrowdinInfo('Fetched Crowdin languages successfully', {
      operation: 'getLanguages',
      languageCount: languages.length
    });
    return languages;
  } catch (error) {
    logCrowdinError('Failed to fetch Crowdin languages', {
      operation: 'getLanguages',
      error: error.message
    });
    if (error.response && error.response.data) {
      logCrowdinError('Crowdin language fetch error details', {
        operation: 'getLanguages',
        details: JSON.stringify(error.response.data, null, 2)
      });
    }
    process.exit(1);
  }
}

async function getFileIds(projectId: number) {
  try {
    const response = await sourceFilesApi.listProjectFiles(projectId);
    const files = response.data;
    const fileIds = files.map(file => file.data.id);
    logCrowdinInfo('Fetched Crowdin file IDs successfully', {
      operation: 'getFileIds',
      fileCount: fileIds.length
    });
    return fileIds;
  } catch (error) {
    logCrowdinError('Failed to fetch Crowdin file IDs', {
      operation: 'getFileIds',
      error: error.message
    });
    if (error.response && error.response.data) {
      logCrowdinError('Crowdin file ID fetch error details', {
        operation: 'getFileIds',
        details: JSON.stringify(error.response.data, null, 2)
      });
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
    logCrowdinInfo('Fetched Crowdin workflow step ID successfully', {
      operation: 'getWorkflowStepId',
      workflowStepId
    });
    return workflowStepId;
  } catch (error) {
    logCrowdinError('Failed to fetch Crowdin workflow step ID', {
      operation: 'getWorkflowStepId',
      error: error.message
    });
    if (error.response && error.response.data) {
      logCrowdinError('Crowdin workflow step fetch error details', {
        operation: 'getWorkflowStepId',
        details: JSON.stringify(error.response.data, null, 2)
      });
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

    logCrowdinInfo('Creating Crowdin task', {
      operation: 'createTask',
      title,
      languageId
    });

    const response = await tasksApi.addTask(projectId, taskParams);
    logCrowdinInfo('Crowdin task created successfully', {
      operation: 'createTask',
      taskId: response.data.id
    });
    return response.data;
  } catch (error) {
    logCrowdinError('Failed to create Crowdin task', {
      operation: 'createTask',
      error: error.message
    });
    if (error.response && error.response.data) {
      logCrowdinError('Crowdin task creation error details', {
        operation: 'createTask',
        details: JSON.stringify(error.response.data, null, 2)
      });
    }
    process.exit(1);
  }
}
