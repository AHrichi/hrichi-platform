import type { CompetencyTier } from './tier.model';

export type SoftwareEngineeringDomain =
  | 'languages-runtimes'
  | 'frontend-web'
  | 'backend-distributed'
  | 'data-structures-algos'
  | 'databases-storage'
  | 'devops-cloud-networking'
  | 'architecture-patterns'
  | 'security-testing';

export interface SoftwareEngineeringDomainMeta {
  readonly id: SoftwareEngineeringDomain;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
  readonly suggestedTopics: readonly string[];
}

export const SE_DOMAINS: readonly SoftwareEngineeringDomainMeta[] = [
  {
    id: 'languages-runtimes',
    label: 'Languages & Runtimes',
    icon: '⚡',
    description: 'JavaScript (V8), TypeScript, Rust, Go, Python, Java/JVM, C++',
    suggestedTopics: [
      'JavaScript Core & V8',
      'TypeScript Advanced Types',
      'Rust Ownership & Concurrency',
      'Go Goroutines & Channels',
    ],
  },
  {
    id: 'frontend-web',
    label: 'Frontend & Web Architecture',
    icon: '🌐',
    description: 'Angular Zoneless, React Internals, Browser Rendering Engine, Web APIs',
    suggestedTopics: [
      'Angular Signals & Zoneless Architecture',
      'Browser Rendering & Event Loop',
      'Modern Web Performance & Core Web Vitals',
    ],
  },
  {
    id: 'backend-distributed',
    label: 'Backend & Distributed Systems',
    icon: '🏗️',
    description: 'Microservices, Raft Consensus, gRPC, Event-Driven Architecture, Caching',
    suggestedTopics: [
      'Distributed Consensus & Raft',
      'Event-Driven Architectures with Kafka',
      'High-Throughput Node.js Streams',
    ],
  },
  {
    id: 'databases-storage',
    label: 'Databases & Storage Engines',
    icon: '🗄️',
    description: 'PostgreSQL Internals, B-Tree & LSM Trees, Indexing, Transactions, MVCC',
    suggestedTopics: [
      'PostgreSQL Indexing & MVCC',
      'Distributed Key-Value Stores',
      'Database Query Optimization & WAL',
    ],
  },
  {
    id: 'data-structures-algos',
    label: 'Data Structures & Algorithms',
    icon: '🧩',
    description: 'Complexity analysis, Graph Algorithms, Dynamic Programming, Tree balancing',
    suggestedTopics: [
      'Graph Algorithms & Shortest Path',
      'Dynamic Programming Optimization',
      'Balanced Search Trees & Tries',
    ],
  },
  {
    id: 'devops-cloud-networking',
    label: 'DevOps, Cloud & Networking',
    icon: '☁️',
    description: 'TCP/IP, HTTP/3, Docker, Kubernetes, Service Mesh, CI/CD pipelines',
    suggestedTopics: [
      'TCP/IP & HTTP/3 Transport Protocols',
      'Kubernetes Architecture & Controllers',
      'Linux Networking & Namespaces',
    ],
  },
  {
    id: 'architecture-patterns',
    label: 'Software Architecture & Patterns',
    icon: '📐',
    description: 'Domain-Driven Design (DDD), Clean Architecture, CQRS, Hexagonal',
    suggestedTopics: [
      'Domain-Driven Design (DDD)',
      'CQRS & Event Sourcing',
      'Clean & Hexagonal Architecture',
    ],
  },
  {
    id: 'security-testing',
    label: 'Security, Cryptography & Testing',
    icon: '🛡️',
    description: 'OAuth2/OIDC, PKI, OWASP Top 10, Zero-Trust, Property-Based Testing',
    suggestedTopics: [
      'OAuth 2.1 & OpenID Connect Protocols',
      'Zero-Trust Architecture & mTLS',
      'Web Cryptography & Public-Key Infrastructure',
    ],
  },
];

export type GenerationStatus = 'idle' | 'generating' | 'ready' | 'error';

export interface OfficialDocRef {
  readonly title: string;
  readonly url: string;
}

export interface RoadmapSection {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly summary: string;
  readonly difficultyTier: CompetencyTier;
  readonly subtopics: readonly string[];
  readonly officialDocs: readonly OfficialDocRef[];
  approved: boolean;
  flashcardsStatus: GenerationStatus;
  quizStatus: GenerationStatus;
  flashcardsProvider?: string;
  quizProvider?: string;
  lastError?: string;
}

export interface RoadmapBranch {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly sections: RoadmapSection[];
}

export interface CurriculumRoadmap {
  readonly canonicalSubject: string;
  readonly domain: SoftwareEngineeringDomain;
  readonly officialDocPortal: string;
  readonly overviewSummary: string;
  readonly branches: RoadmapBranch[];
}
