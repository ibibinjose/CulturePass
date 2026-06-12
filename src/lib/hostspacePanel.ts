import { HOSTSPACE_CREATE_PANEL } from '@/constants/navigation/createNav';

type ParamValue = string | string[] | undefined;

function firstParam(v: ParamValue): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** True when /hostspace should render the create panel instead of manage. */
export function isHostspaceCreateMode(params: {
  panel?: ParamValue;
  category?: ParamValue;
  entityType?: ParamValue;
  draftId?: ParamValue;
  pageId?: ParamValue;
  template?: ParamValue;
}): boolean {
  const panel = firstParam(params.panel);
  if (panel === HOSTSPACE_CREATE_PANEL) return true;
  if (firstParam(params.category)) return true;
  if (firstParam(params.entityType)) return true;
  if (firstParam(params.draftId)) return true;
  if (firstParam(params.pageId)) return true;
  if (firstParam(params.template)) return true;
  return false;
}