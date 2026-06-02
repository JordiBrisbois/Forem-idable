import { expect, test, type Page, type Route } from "@playwright/test";

type Actor = "user" | "coach";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  publicationDate: string;
  url: string;
  source: "forem";
};

type Application = {
  job: Job;
  sourceType?: "manual" | "tracked";
  appliedAt: string;
  followUpDueAt: string;
  followUpEnabled: boolean;
  lastFollowUpAt?: string | null;
  status: "in_progress";
  notes: string | null;
  proofs: string | null;
  interviewAt: null;
  interviewDetails: null;
  updatedAt: string;
  privateCoachNote?: {
    content: string;
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      role: "coach" | "admin" | "system";
    };
    contributors: Array<{
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      role: "coach" | "admin" | "system";
    }>;
  };
  sharedCoachNotes?: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      role: "coach" | "admin" | "system";
    };
    contributors: Array<{
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      role: "coach" | "admin" | "system";
    }>;
  }>;
};

const locationEntries = [
  { id: "be", name: "Belgique", type: "Pays" },
  { id: "wal", name: "Wallonie", type: "Régions", parentId: "be" },
  { id: "lg", name: "Liège", type: "Provinces", parentId: "wal" },
  { id: "loc-liege", name: "4000 Liège", type: "Localités", parentId: "lg", postalCode: "4000" },
];

const searchJob: Job = {
  id: "forem-1",
  title: "Développeur Frontend React",
  company: "ACME",
  location: "Liège",
  contractType: "CDI",
  publicationDate: "2026-03-20T09:00:00.000Z",
  url: "https://example.test/jobs/forem-1",
  source: "forem",
};

function createApplication(job: Job): Application {
  return {
    job,
    appliedAt: "2026-03-21T10:00:00.000Z",
    followUpDueAt: "2026-03-28T10:00:00.000Z",
    followUpEnabled: true,
    status: "in_progress",
    notes: null,
    proofs: null,
    interviewAt: null,
    interviewDetails: null,
    updatedAt: "2026-03-21T10:00:00.000Z",
  };
}

function buildCoachDashboard(applications: Application[]) {
  return {
    viewer: {
      id: 2,
      email: "coach@example.com",
      firstName: "Camille",
      lastName: "Coach",
      role: "coach",
    },
    users: [
      {
        id: 1,
        email: "user@example.com",
        firstName: "Jordi",
        lastName: "User",
        role: "user",
        groupIds: [10],
        groupNames: ["Groupe Liège"],
        applicationCount: applications.length,
        interviewCount: 0,
        dueCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        inProgressCount: applications.length,
        latestActivityAt: applications[0]?.updatedAt ?? null,
        lastSeenAt: "2026-03-21T12:00:00.000Z",
        lastCoachActionAt: null,
        applications,
      },
    ],
    groups: [
      {
        id: 10,
        name: "Groupe Liège",
        createdAt: "2026-03-20T09:00:00.000Z",
        createdBy: {
          id: 2,
          email: "coach@example.com",
          firstName: "Camille",
          lastName: "Coach",
        },
        managerCoachId: 2,
        members: [
          {
            id: 1,
            email: "user@example.com",
            firstName: "Jordi",
            lastName: "User",
            role: "user",
            lastSeenAt: "2026-03-21T12:00:00.000Z",
          },
        ],
        coaches: [
          {
            id: 2,
            email: "coach@example.com",
            firstName: "Camille",
            lastName: "Coach",
            role: "coach",
            lastSeenAt: "2026-03-21T12:00:00.000Z",
          },
        ],
      },
    ],
    availableCoaches: [
      {
        id: 2,
        email: "coach@example.com",
        firstName: "Camille",
        lastName: "Coach",
        role: "coach",
        lastSeenAt: "2026-03-21T12:00:00.000Z",
      },
    ],
  };
}

async function mockCoachSession(
  page: Page,
  options: {
    actor?: Actor;
    applications: Application[];
    onCoachNotesPatch?: (payload: {
      userId: number;
      jobId: string;
      action: "save-private" | "create-shared" | "update-shared" | "delete-shared";
      content?: string;
      noteId?: string;
    }) => Application;
    onApplicationPatch?: (payload: {
      userId: number;
      jobId: string;
      patch: Partial<Application>;
    }) => Application;
  }
) {
  let actor: Actor = options.actor ?? "coach";

  await page.route("**/api/auth/me", async (route: Route) => {
    const user =
      actor === "user"
        ? {
            id: 1,
            email: "user@example.com",
            firstName: "Jordi",
            lastName: "User",
            role: "user",
          }
        : {
            id: 2,
            email: "coach@example.com",
            firstName: "Camille",
            lastName: "Coach",
            role: "coach",
          };

    await route.fulfill({ json: { user } });
  });

  await page.route("**/api/coach/dashboard", async (route: Route) => {
    await route.fulfill({
      json: {
        dashboard: buildCoachDashboard(options.applications),
      },
    });
  });

  await page.route("**/api/coach/users/1/applications", async (route: Route) => {
    const request = route.request();
    const body = request.postDataJSON() as {
      jobId: string;
      action: "save-private" | "create-shared" | "update-shared" | "delete-shared";
      content?: string;
      noteId?: string;
    };

    if (request.method() !== "PATCH" || !options.onCoachNotesPatch) {
      await route.fallback();
      return;
    }

    const updated = options.onCoachNotesPatch({
      userId: 1,
      jobId: body.jobId,
      action: body.action,
      content: body.content,
      noteId: body.noteId,
    });

    await route.fulfill({ json: { application: updated } });
  });

  await page.route("**/api/coach/users/1/applications/*", async (route: Route) => {
    const request = route.request();
    const jobId = request.url().split("/").pop() ?? "";

    if (request.method() !== "PATCH" || !options.onApplicationPatch) {
      await route.fallback();
      return;
    }

    const body = request.postDataJSON() as {
      patch: Partial<Application>;
    };
    const updated = options.onApplicationPatch({
      userId: 1,
      jobId,
      patch: body.patch,
    });

    await route.fulfill({ json: { application: updated } });
  });

  return {
    setActor(nextActor: Actor) {
      actor = nextActor;
    },
  };
}

async function mockUserApplicationsSession(
  page: Page,
  options: {
    applications: Application[];
    onApplicationPatch?: (payload: {
      jobId: string;
      patch: Partial<Application> & { job?: Partial<Job> };
    }) => Application;
  }
) {
  await page.route("**/api/auth/me", async (route: Route) => {
    await route.fulfill({
      json: {
        user: {
          id: 1,
          email: "user@example.com",
          firstName: "Jordi",
          lastName: "User",
          role: "user",
        },
      },
    });
  });

  await page.route("**/api/applications", async (route: Route) => {
    const request = route.request();

    if (request.method() === "GET") {
      await route.fulfill({ json: { applications: options.applications } });
      return;
    }

    await route.fallback();
  });

  await page.route("**/api/applications/*", async (route: Route) => {
    const request = route.request();
    const jobId = request.url().split("/").pop() ?? "";

    if (request.method() !== "PATCH" || !options.onApplicationPatch) {
      await route.fallback();
      return;
    }

    const body = request.postDataJSON() as {
      patch: Partial<Application> & { job?: Partial<Job> };
    };
    const updated = options.onApplicationPatch({
      jobId,
      patch: body.patch,
    });

    await route.fulfill({ json: { application: updated } });
  });
}

test("user can add a job to tracking and the coach can see it", async ({ page }) => {
  let actor: Actor = "user";
  let applications: Application[] = [];

  await page.route("**/api/auth/me", async (route: Route) => {
    const user =
      actor === "user"
        ? {
            id: 1,
            email: "user@example.com",
            firstName: "Jordi",
            lastName: "User",
            role: "user",
          }
        : {
            id: 2,
            email: "coach@example.com",
            firstName: "Camille",
            lastName: "Coach",
            role: "coach",
          };

    await route.fulfill({ json: { user } });
  });

  await page.route("**/api/locations", async (route: Route) => {
    await route.fulfill({ json: { entries: locationEntries } });
  });

  await page.route("**/api/search-history", async (route: Route) => {
    await route.fulfill({ json: { history: [] } });
  });

  await page.route("https://www.odwb.be/api/explore/**", async (route: Route) => {
    await route.fulfill({
      json: {
        results: [
          {
            numerooffreforem: searchJob.id,
            titreoffre: searchJob.title,
            nomemployeur: searchJob.company,
            lieuxtravaillocalite: [searchJob.location],
            typecontrat: searchJob.contractType,
            datedebutdiffusion: searchJob.publicationDate,
            url: searchJob.url,
          },
        ],
        total_count: 1,
      },
    });
  });

  await page.route("**/api/providers/adzuna/search", async (route: Route) => {
    await route.fulfill({ json: { enabled: false, jobs: [], total: 0 } });
  });

  await page.route("**/api/applications", async (route: Route) => {
    const request = route.request();

    if (request.method() === "GET") {
      await route.fulfill({ json: { applications } });
      return;
    }

    if (request.method() === "POST") {
      const body = request.postDataJSON() as { job: Job };
      const application = createApplication(body.job);
      applications = [application];
      await route.fulfill({ json: { application } });
      return;
    }

    await route.fallback();
  });

  await page.route("**/api/coach/dashboard", async (route: Route) => {
    await route.fulfill({
      json: {
        dashboard: buildCoachDashboard(applications),
      },
    });
  });

  await page.goto("/?kw=react&bm=OR");

  await expect(page.getByTitle("Ajouter au suivi")).toBeVisible();
  await page.getByTitle("Ajouter au suivi").click();
  await expect(page.getByTitle("Déjà dans le suivi")).toBeVisible();

  actor = "coach";
  await page.goto("/coach");

  await expect(page.getByText("Jordi User").first()).toBeVisible();
  await page.getByText("Jordi User").first().click();
  await expect(page.getByRole("heading", { name: "Jordi User" })).toBeVisible();
  await expect(page.getByText("Développeur Frontend React").last()).toBeVisible();
  await expect(page.getByText("1 candidatures").first()).toBeVisible();
});

test("coach can manage private and shared notes from the user sheet", async ({ page }) => {
  const noteAuthor = {
    id: 2,
    email: "coach@example.com",
    firstName: "Camille",
    lastName: "Coach",
    role: "coach" as const,
  };

  const applications: Application[] = [
    {
      ...createApplication(searchJob),
      notes: "CV envoyé",
      privateCoachNote: {
        content: "Point initial",
        createdAt: "2026-03-21T10:00:00.000Z",
        updatedAt: "2026-03-21T10:00:00.000Z",
        createdBy: noteAuthor,
        contributors: [noteAuthor],
      },
      sharedCoachNotes: [],
    },
  ];

  await mockCoachSession(page, {
    applications,
    onCoachNotesPatch: ({ jobId, action, content, noteId }) => {
      const application = applications.find((entry) => entry.job.id === jobId);
      if (!application) {
        throw new Error(`Application ${jobId} not found`);
      }

      if (action === "save-private") {
        application.privateCoachNote = {
          content: content ?? "",
          createdAt: application.privateCoachNote?.createdAt ?? "2026-03-23T16:00:00.000Z",
          updatedAt: "2026-03-23T16:01:00.000Z",
          createdBy: noteAuthor,
          contributors: [noteAuthor],
        };
      }

      if (action === "create-shared") {
        application.sharedCoachNotes = [
          ...(application.sharedCoachNotes ?? []),
          {
            id: "shared-1",
            content: content ?? "",
            createdAt: "2026-03-23T16:02:00.000Z",
            updatedAt: "2026-03-23T16:02:00.000Z",
            createdBy: noteAuthor,
            contributors: [noteAuthor],
          },
        ];
      }

      if (action === "update-shared") {
        application.sharedCoachNotes =
          application.sharedCoachNotes?.map((entry) =>
            entry.id === noteId
              ? {
                  ...entry,
                  content: content ?? entry.content,
                  updatedAt: "2026-03-23T16:03:00.000Z",
                }
              : entry
          ) ?? [];
      }

      if (action === "delete-shared") {
        application.sharedCoachNotes =
          application.sharedCoachNotes?.filter((entry) => entry.id !== noteId) ?? [];
      }

      application.updatedAt = "2026-03-23T16:03:00.000Z";
      return structuredClone(application);
    },
  });

  await page.goto("/coach");
  await page.getByText("Jordi User").first().click();

  const privateNoteArea = page.getByPlaceholder("Note privée commune pour l'équipe coach...");
  await privateNoteArea.fill("Note privée mise à jour");
  await page.getByRole("button", { name: "Enregistrer" }).first().click();
  await expect(page.getByText("Note privée enregistrée.")).toBeVisible();
  await expect(privateNoteArea).toHaveValue("Note privée mise à jour");

  await page.getByRole("button", { name: "Ajouter une note partagée" }).first().click();
  const sharedCreateArea = page.getByPlaceholder("Message ou consigne visible par le bénéficiaire...");
  await sharedCreateArea.fill("Nouvelle note visible");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByText("Note partagée enregistrée.")).toBeVisible();
  const sharedNoteArea = page.getByTestId("coach-shared-note-editor").first();
  await expect(sharedNoteArea).toHaveValue("Nouvelle note visible");
  await sharedNoteArea.fill("Nouvelle note visible modifiée");
  await page.getByRole("button", { name: "Enregistrer" }).last().click();
  await expect(page.getByText("Note partagée mise à jour.")).toBeVisible();
  await expect(sharedNoteArea).toHaveValue("Nouvelle note visible modifiée");

  await page.getByRole("button", { name: "Supprimer" }).last().click();
  await page.getByRole("button", { name: "Supprimer" }).last().click();
  await expect(page.getByText("Note partagée supprimée.")).toBeVisible();
  await expect(page.getByText(/Aucune note partagée pour l'instant\./i)).toBeVisible();
});

test("coach can edit a tracked application from the user sheet", async ({ page }) => {
  const applications: Application[] = [
    {
      ...createApplication(searchJob),
      notes: null,
    },
  ];

  await mockCoachSession(page, {
    applications,
    onApplicationPatch: ({ jobId, patch }) => {
      const application = applications.find((entry) => entry.job.id === jobId);
      if (!application) {
        throw new Error(`Application ${jobId} not found`);
      }

      Object.assign(application, patch, {
        updatedAt: "2026-03-23T16:10:00.000Z",
      });

      return structuredClone(application);
    },
  });

  await page.goto("/coach");
  await page.getByText("Jordi User").first().click();

  await page.getByRole("button", { name: "Actions candidature" }).click();
  await page.getByRole("menuitem", { name: "Éditer la candidature" }).click();
  await page.getByLabel("Notes bénéficiaire").fill("Relance prévue lundi");
  await page.getByRole("button", { name: "Enregistrer les changements" }).click();

  await expect(page.getByText("Candidature mise à jour.")).toBeVisible();
  await expect(page.getByText("Notes bénéficiaire")).toBeVisible();
  await expect(page.getByText("Relance prévue lundi")).toBeVisible();
});

test("coach can edit a manual application from the user sheet", async ({ page }) => {
  const manualApplication: Application = {
    ...createApplication({
      id: "manual-1",
      title: "Candidature spontanée",
      company: "ACME",
      location: "Namur",
      contractType: "CDD",
      publicationDate: "2026-03-20T09:00:00.000Z",
      url: "#",
      source: "forem",
    }),
    sourceType: "manual" as const,
    notes: "Premier contact établi",
  };

  const applications: Application[] = [manualApplication];

  await mockCoachSession(page, {
    applications,
    onApplicationPatch: ({ jobId, patch }) => {
      const application = applications.find((entry) => entry.job.id === jobId);
      if (!application) {
        throw new Error(`Application ${jobId} not found`);
      }

      Object.assign(application, patch, {
        job: patch.job ? { ...application.job, ...patch.job } : application.job,
        updatedAt: "2026-03-23T16:20:00.000Z",
      });

      return structuredClone(application);
    },
  });

  await page.goto("/coach");
  await page.getByText("Jordi User").first().click();

  await page.getByRole("button", { name: "Actions candidature" }).click();
  await page.getByRole("menuitem", { name: "Éditer la candidature" }).click();
  await page.getByLabel("Intitulé").fill("Candidature spontanée senior");
  await page.getByLabel("Lien de l'offre").fill("https://example.test/manual-1");
  await page.getByRole("button", { name: "Enregistrer les changements" }).click();

  await expect(page.getByText("Candidature mise à jour.")).toBeVisible();
  await expect(page.getByText("Candidature spontanée senior").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "WEB" })).toHaveAttribute(
    "href",
    "https://example.test/manual-1"
  );
});

test("user can manage follow-up and interview from the applications page", async ({ page }) => {
  const applications: Application[] = [
    {
      ...createApplication(searchJob),
      notes: "CV envoyé",
    },
  ];

  await mockUserApplicationsSession(page, {
    applications,
    onApplicationPatch: ({ jobId, patch }) => {
      const application = applications.find((entry) => entry.job.id === jobId);
      if (!application) {
        throw new Error(`Application ${jobId} not found`);
      }

      Object.assign(application, patch, {
        updatedAt: "2026-03-23T17:00:00.000Z",
      });

      return structuredClone(application);
    },
  });

  await page.goto("/applications");

  await page.getByRole("button", { name: "Relancer" }).first().click();
  await expect
    .poll(() => applications[0]?.lastFollowUpAt ?? null)
    .not.toBeNull();

  await page.getByRole("button", { name: "Détails" }).first().click();

  const followUpInput = page.getByLabel("Relance active");
  await followUpInput.fill("2026-04-01");
  await page.getByRole("button", { name: "Mettre à jour la relance" }).click();
  await expect
    .poll(() => applications[0]?.followUpDueAt ?? "")
    .toBe("2026-04-01");

  await page.getByRole("button", { name: "Désactiver la relance" }).click();
  await expect
    .poll(() => applications[0]?.followUpEnabled)
    .toBe(false);
  await expect(page.getByText("Relance désactivée pour cette candidature.")).toBeVisible();

  await page.getByRole("button", { name: "Activer la relance" }).click();
  await expect
    .poll(() => applications[0]?.followUpEnabled)
    .toBe(true);

  await page.getByRole("button", { name: "Entretien" }).last().click();
  const interviewDialog = page.getByRole("dialog");
  await interviewDialog.getByLabel("Date et heure").fill("2026-04-03T14:30");
  await interviewDialog
    .getByLabel("Informations pratiques")
    .fill("Visio RH avec partage d'écran");
  await interviewDialog.getByRole("button", { name: "Enregistrer" }).click();

  await expect
    .poll(() => applications[0]?.interviewDetails ?? "")
    .toBe("Visio RH avec partage d'écran");
  await expect(page.getByText("Visio RH avec partage d'écran")).toBeVisible();
});

test("user can edit a manual application from the applications page", async ({ page }) => {
  const manualApplication: Application = {
    ...createApplication({
      id: "manual-2",
      title: "Candidature spontanée",
      company: "ACME",
      location: "Namur",
      contractType: "CDD",
      publicationDate: "2026-03-20T09:00:00.000Z",
      url: "#",
      source: "forem",
    }),
    sourceType: "manual" as const,
    notes: "Premier contact établi",
  };

  const applications: Application[] = [manualApplication];

  await mockUserApplicationsSession(page, {
    applications,
    onApplicationPatch: ({ jobId, patch }) => {
      const application = applications.find((entry) => entry.job.id === jobId);
      if (!application) {
        throw new Error(`Application ${jobId} not found`);
      }

      Object.assign(application, patch, {
        job: patch.job ? { ...application.job, ...patch.job } : application.job,
        updatedAt: "2026-03-23T17:10:00.000Z",
      });

      return structuredClone(application);
    },
  });

  await page.goto("/applications");
  await page.getByRole("button", { name: "Détails" }).first().click();

  await page.getByRole("button", { name: "Éditer" }).click();
  await page.getByLabel("Intitulé").fill("Candidature spontanée senior");
  await page.getByLabel("Lien de l'offre").fill("https://example.test/manual-2");
  await page.getByRole("button", { name: /^Enregistrer$/ }).first().click();

  await expect(page.getByText("Candidature spontanée senior").first()).toBeVisible();
  await expect(page.getByText("Lien: https://example.test/manual-2")).toBeVisible();
});
