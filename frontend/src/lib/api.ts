/**
 * API client for Anveshan Research AI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// Dashboard stats
export async function getDashboardStats() {
  return fetchAPI<DashboardStats>('/api/stats/dashboard');
}

// Documents
export async function getDocuments(params?: { department?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.department) query.set('department', params.department);
  if (params?.limit) query.set('limit', String(params.limit));
  return fetchAPI<DocumentInfo[]>(`/api/documents/?${query.toString()}`);
}

export async function getDocument(id: string) {
  return fetchAPI<DocumentDetail>(`/api/documents/${id}`);
}

export async function uploadDocument(formData: FormData) {
  const url = `${API_BASE}/api/documents/upload`;
  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }
  return res.json();
}

export async function ingestUrl(data: { url: string; title?: string; department?: string; source?: string }) {
  return fetchAPI<any>('/api/documents/ingest-url', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function compareLinks(data: { urls: string[]; department?: string }) {
  return fetchAPI<any>('/api/documents/compare-links', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteDocument(id: string) {
  return fetchAPI<{ status: string; document_id: string; title: string; message: string }>(
    `/api/documents/${id}`,
    { method: 'DELETE' }
  );
}

// Graph
export async function getGraphData(params?: { entity_types?: string; departments?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.entity_types) query.set('entity_types', params.entity_types);
  if (params?.departments) query.set('departments', params.departments);
  if (params?.limit) query.set('limit', String(params.limit));
  return fetchAPI<GraphData>(`/api/graph/?${query.toString()}`);
}

export async function getEntityDetails(entityId: string) {
  return fetchAPI<EntityDetail>(`/api/graph/entity/${entityId}`);
}

// Search
export async function searchResearch(query: string, searchType = 'hybrid', limit = 10) {
  return fetchAPI<SearchResults>('/api/search/', {
    method: 'POST',
    body: JSON.stringify({ query, search_type: searchType, limit }),
  });
}

// Research Assistant
export async function queryAssistant(query: string) {
  return fetchAPI<AssistantResponse>('/api/assistant/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

// Insights
export async function getConnections(minScore = 0.2, limit = 50) {
  return fetchAPI<InsightData[]>(`/api/insights/connections?min_score=${minScore}&limit=${limit}`);
}

export async function getOverlap(minScore = 0.4, limit = 50) {
  return fetchAPI<InsightData[]>(`/api/insights/overlap?min_score=${minScore}&limit=${limit}`);
}

// Types
export interface DashboardStats {
  total_documents: number;
  total_entities: number;
  total_relationships: number;
  total_researchers: number;
  total_insights: number;
  total_departments: number;
  entity_type_distribution: Record<string, number>;
  connection_type_distribution: Record<string, number>;
  recent_ingestions: {
    id: string;
    document_id: string;
    status: string;
    stage: string;
    created_at: string;
  }[];
}

export interface DocumentInfo {
  id: string;
  title: string;
  filename: string;
  document_type: string;
  department: string;
  source?: string;
  authors: string[];
  created_at: string;
}

export interface DocumentDetail extends DocumentInfo {
  abstract: string;
  content: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  department: string | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
}

export interface EntityDetail {
  id: string;
  name: string;
  type: string;
  documents: { id: string; title: string; department: string }[];
  relationships: { source: string; target: string; type: string; confidence: number }[];
}

export interface SearchResults {
  query: string;
  documents: {
    id: string;
    title: string;
    department: string;
    authors: string[];
    content_preview: string;
    similarity: number;
  }[];
  entities: {
    id: string;
    name: string;
    type: string;
  }[];
}

export interface AssistantResponse {
  query: string;
  query_type: string;
  answer: {
    answer: string;
    cited_documents: string[];
    discovered_connections: {
      description: string;
      documents: string[];
      connection_type: string;
    }[];
    confidence: number;
  };
  retrieved_documents: {
    title: string;
    department: string;
    similarity: number;
  }[];
  entities_found: number;
  relationships_found: number;
}

export interface InsightData {
  id: string;
  source_document: { id: string; title: string; department: string };
  target_document: { id: string; title: string; department: string };
  similarity_score: number;
  overlap_label: string;
  connection_type: string;
  explanation: string;
  shared_entities: { name: string; type: string }[];
  confidence: number;
}
