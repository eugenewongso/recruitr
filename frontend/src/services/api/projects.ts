/**
 * Projects API - AI-assisted research projects
 */

import apiClient from "./base";

export interface ProjectStrategy {
  search_queries: string[];
  filters?: Record<string, any>;
  target_count: number;
  reasoning: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  goal: string;
  status: "draft" | "in_progress" | "completed" | "archived";
  ai_generated_strategy?: ProjectStrategy;
  participant_ids: string[];
  participants: any[];
  search_queries: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  goal: string;
  name?: string;
  target_count?: number;
  preferences?: {
    experience_level?: string;
    remote_only?: boolean;
    skills?: string[];
    tools?: string[];
    employment_type?: string;
    min_years_experience?: number;
  };
}

export interface AgentResponse {
  project_id: string;
  project_name: string;
  strategy: ProjectStrategy;
  participants: any[];
  total_found: number;
  message: string;
}

export interface ProjectListResponse {
  projects: Project[];
  count: number;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: string;
  participant_ids?: string[];
  participants?: any[];
  notes?: string;
}

/**
 * Create a new project using AI agent
 */
export const createProjectWithAgent = async (
  request: CreateProjectRequest
): Promise<AgentResponse> => {
  const response = await apiClient.post("/researcher/projects", request);
  return response.data;
};

/**
 * Get all projects for current user
 */
export const getProjects = async (): Promise<ProjectListResponse> => {
  const response = await apiClient.get("/researcher/projects");
  return response.data;
};

/**
 * Get a specific project by ID
 */
export const getProject = async (projectId: string): Promise<Project> => {
  const response = await apiClient.get(`/researcher/projects/${projectId}`);
  return response.data;
};

/**
 * Update a project
 */
export const updateProject = async (
  projectId: string,
  request: UpdateProjectRequest
): Promise<Project> => {
  const response = await apiClient.patch(`/researcher/projects/${projectId}`, request);
  return response.data;
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  await apiClient.delete(`/researcher/projects/${projectId}`);
};

