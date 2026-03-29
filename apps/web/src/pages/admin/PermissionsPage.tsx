import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../../hooks/useApi';
import { Card, CardBody, Badge, PageHeader, Input } from '../../components/ui';
import { IconPermissions, IconSearch, IconShield } from '../../components/icons';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Permission {
  id: string;
  key: string;
  category: string; // "Module" | "Page" | "Action"
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  route?: string;
  sortOrder: number;
  isSystem: boolean;
  roleNames?: string[];
}

type GroupedPermissions = Record<string, Permission[]>;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Extract the module prefix from a dot-notation key (e.g. "meetings.view" -> "meetings") */
function moduleOf(key: string): string {
  return key.split('.')[0];
}

/** Capitalize the first letter of a string */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CATEGORY_STYLES: Record<string, string> = {
  Module: 'bg-purple-50 text-purple-700',
  Page: 'bg-blue-50 text-blue-700',
  Action: 'bg-green-50 text-green-700',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PermissionsPage() {
  const { get } = useApi();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  /* ----- state ----- */
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  /* ----- fetch ----- */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await get<GroupedPermissions>('/api/v1/permissions');
        if (cancelled) return;
        // Flatten all categories into a single list
        const flat = Object.values(res).flat();
        flat.sort((a, b) => a.sortOrder - b.sortOrder);
        setPermissions(flat);
        // Expand all modules by default
        const modules = new Set(flat.map((p) => moduleOf(p.key)));
        setExpandedModules(modules);
      } catch {
        // read-only page; silently ignore errors
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [get]);

  /* ----- derived data ----- */
  const filtered = useMemo(() => {
    if (!search.trim()) return permissions;
    const q = search.toLowerCase();
    return permissions.filter(
      (p) =>
        p.key.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.includes(q) ||
        (p.route && p.route.toLowerCase().includes(q)) ||
        (p.roleNames && p.roleNames.some((r) => r.toLowerCase().includes(q))),
    );
  }, [permissions, search]);

  const moduleGroups = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of filtered) {
      const mod = moduleOf(p.key);
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod)!.push(p);
    }
    return map;
  }, [filtered]);

  /* ----- toggle ----- */
  function toggleModule(mod: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  }

  /* ----- category label ----- */
  function categoryLabel(cat: string): string {
    switch (cat) {
      case 'Module':
        return t('permissionManagement.module');
      case 'Page':
        return t('permissionManagement.page');
      case 'Action':
        return t('permissionManagement.action');
      default:
        return cat;
    }
  }

  /* ----- render ----- */
  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title={t('permissionManagement.title')}
        description={t('permissionManagement.description')}
      />

      {/* Summary card */}
      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <IconShield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400">
              {t('permissionManagement.totalPermissions')}
            </p>
            <p className="text-lg font-bold text-neutral-900">{permissions.length}</p>
          </div>
        </CardBody>
      </Card>

      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400">
          <IconSearch className="h-4 w-4" />
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('permissionManagement.searchPlaceholder')}
          className="ps-9"
        />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardBody>
                <div className="h-5 w-1/3 animate-pulse rounded bg-neutral-200" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center">
            <IconPermissions className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-3 text-sm text-neutral-500">
              {t('permissionManagement.noPermissions')}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Module groups */}
      {!loading &&
        Array.from(moduleGroups.entries()).map(([mod, perms]) => {
          const isExpanded = expandedModules.has(mod);
          return (
            <Card key={mod}>
              {/* Collapsible header */}
              <button
                type="button"
                onClick={() => toggleModule(mod)}
                className="flex w-full items-center justify-between px-5 py-4 text-start transition-colors hover:bg-neutral-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <IconPermissions className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">
                    {capitalize(mod)}
                  </span>
                  <Badge variant="default">{perms.length}</Badge>
                </div>
                <svg
                  className={`h-5 w-5 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Permission list */}
              {isExpanded && (
                <div className="border-t border-neutral-200">
                  <div className="divide-y divide-neutral-100">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
                      >
                        {/* Key & name */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-xs text-neutral-600">
                            {perm.key}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-neutral-900">
                            {isAr ? perm.nameAr : perm.nameEn}
                          </p>
                        </div>

                        {/* Category badge */}
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[perm.category] ?? 'bg-neutral-100 text-neutral-700'}`}
                        >
                          {categoryLabel(perm.category)}
                        </span>

                        {/* Route */}
                        {perm.route && (
                          <span className="shrink-0 truncate font-mono text-xs text-neutral-400">
                            {perm.route}
                          </span>
                        )}

                        {/* Assigned roles */}
                        {perm.roleNames && perm.roleNames.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {perm.roleNames.map((role) => (
                              <Badge key={role} variant="brand" className="text-[10px]">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
    </div>
  );
}
