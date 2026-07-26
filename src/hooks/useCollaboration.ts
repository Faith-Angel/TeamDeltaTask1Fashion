'use client';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collaborationsApi } from '@/services/apiClient';
import { QUERY_KEYS } from '@/lib/constants';
import type { CollaborationProject, PaginatedResponse } from '@/types/models';

export function useCollaborationProjects() {
  return useInfiniteQuery<PaginatedResponse<CollaborationProject>>({
    queryKey: [QUERY_KEYS.COLLABORATION_PROJECTS],
    queryFn: ({ pageParam }) => collaborationsApi.getProjects(pageParam as string | undefined).then((r) => r.data),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined,
  });
}

export function useCollaborationProject(id: string) {
  return useQuery<CollaborationProject>({
    queryKey: [QUERY_KEYS.COLLABORATION_PROJECT, id],
    queryFn: () => collaborationsApi.getProject(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCollaborationProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => collaborationsApi.createProject(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COLLABORATION_PROJECTS] });
    },
  });
}

export function useSendInvitation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteeId: string) => collaborationsApi.sendInvitation(projectId, inviteeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COLLABORATION_PROJECT, projectId] });
    },
  });
}

export function useWorkspaceNotes(projectId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACE_NOTES, projectId],
    queryFn: () => collaborationsApi.getWorkspaceNotes(projectId).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useAddNote(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => collaborationsApi.addNote(projectId, content).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACE_NOTES, projectId] });
    },
  });
}

export function useWorkspaceUpdates(projectId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACE_UPDATES, projectId],
    queryFn: () => collaborationsApi.getWorkspaceUpdates(projectId).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function usePostUpdate(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => collaborationsApi.postUpdate(projectId, content).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACE_UPDATES, projectId] });
    },
  });
}
