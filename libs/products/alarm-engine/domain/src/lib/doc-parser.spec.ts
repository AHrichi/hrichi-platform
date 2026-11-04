import { describe, expect, it } from 'vitest';
import {
  extractUniversalTextFromBuffer,
  parseDocumentText,
} from './doc-parser';

describe('doc-parser', () => {
  describe('parseDocumentText', () => {
    it('extracts topic name, description, and chapters from structured document text', () => {
      const raw = `
Course: Advanced Distributed Systems
Overview: Comprehensive study of consensus, replication, and fault tolerance.

Table of Contents
Chapter 1: Network Abstractions & RPC
Chapter 2: Clock Synchronization & Vector Clocks
Chapter 3: Raft Consensus Algorithm
Chapter 4: Paxos & Multi-Paxos
Chapter 5: Distributed Key-Value Stores
      `.trim();

      const result = parseDocumentText(raw, 'distributed-systems.docx');

      expect(result.success).toBe(true);
      expect(result.topicName).toBe('Advanced Distributed Systems');
      expect(result.topicDescription).toBe(
        'Comprehensive study of consensus, replication, and fault tolerance.',
      );
      expect(result.totalChapters).toBe(5);
      expect(result.outlineText).toContain('1. Network Abstractions & RPC');
      expect(result.outlineText).toContain('3. Raft Consensus Algorithm');
    });

    it('infers topic name from fileName when no title header is present', () => {
      const raw = `
1. Memory Management & Pointers
2. Data Structures & Cache Locality
3. Concurrency & Atomicity
      `.trim();

      const result = parseDocumentText(raw, 'operating_systems_syllabus.docx');

      expect(result.success).toBe(true);
      expect(result.topicName).toBe('operating systems syllabus');
      expect(result.totalChapters).toBe(3);
      expect(result.outlineText).toContain('1. Memory Management & Pointers');
    });

    it('handles markdown syllabus with # headers and bullet points', () => {
      const raw = `
# Cloud Native Architecture
Description: Building resilient distributed services with Kubernetes.

## 1. Container Fundamentals & OCI
## 2. Pod Lifecycle & Sidecars
## 3. Ingress Controllers & Service Meshes
## 4. GitOps & Declarative Delivery
      `.trim();

      const result = parseDocumentText(raw, 'cloud-native.md');

      expect(result.success).toBe(true);
      expect(result.topicName).toBe('Cloud Native Architecture');
      expect(result.topicDescription).toBe(
        'Building resilient distributed services with Kubernetes.',
      );
      expect(result.totalChapters).toBe(4);
      expect(result.outlineText).toContain('1. Container Fundamentals & OCI');
      expect(result.outlineText).toContain('4. GitOps & Declarative Delivery');
    });

    it('handles presentations with Slide prefixes', () => {
      const raw = `
Topic: System Design Deep Dive
Slide 1: High Availability & Load Balancing
Slide 2: Database Sharding & Partitioning
Slide 3: Message Queues & Event Streaming
Slide 4: Caching Invalidation Patterns
      `.trim();

      const result = parseDocumentText(raw, 'system-design.pptx');

      expect(result.success).toBe(true);
      expect(result.topicName).toBe('System Design Deep Dive');
      expect(result.totalChapters).toBe(4);
      expect(result.outlineText).toContain(
        '1. High Availability & Load Balancing',
      );
      expect(result.outlineText).toContain(
        '3. Message Queues & Event Streaming',
      );
    });

    it('handles CSV / Excel rows', () => {
      const raw = `
Chapter,Title
1,Relational Schema Design
2,Indexing & Query Optimization
3,Write-Ahead Logs & Crash Recovery
4,Distributed Transactions & 2PC
      `.trim();

      const result = parseDocumentText(raw, 'databases.csv');

      expect(result.success).toBe(true);
      expect(result.totalChapters).toBe(4);
      expect(result.outlineText).toContain('1. Relational Schema Design');
      expect(result.outlineText).toContain('4. Distributed Transactions & 2PC');
    });

    it('handles empty text gracefully', () => {
      const result = parseDocumentText('');
      expect(result.success).toBe(false);
      expect(result.totalChapters).toBe(0);
      expect(result.error).toBeDefined();
    });
  });

  describe('extractUniversalTextFromBuffer', () => {
    it('extracts plain text / markdown files', async () => {
      const content =
        '# TypeScript Mastery\n1. Type Narrowing\n2. Conditional Types';
      const buf = new TextEncoder().encode(content);
      const text = await extractUniversalTextFromBuffer(buf, 'course.md');
      expect(text).toContain('# TypeScript Mastery');
      expect(text).toContain('1. Type Narrowing');
    });

    it('extracts CSV rows', async () => {
      const csv = 'Chapter,Title\n1,Microservices\n2,Monolith Migration';
      const buf = new TextEncoder().encode(csv);
      const text = await extractUniversalTextFromBuffer(buf, 'plan.csv');
      expect(text).toContain('1. Microservices');
      expect(text).toContain('2. Monolith Migration');
    });

    it('extracts JSON course data', async () => {
      const json = JSON.stringify({
        topics: [
          { chapterNumber: 1, title: 'Linear Algebra' },
          { chapterNumber: 2, title: 'Calculus' },
        ],
      });
      const buf = new TextEncoder().encode(json);
      const text = await extractUniversalTextFromBuffer(buf, 'math.json');
      expect(text).toContain('1. Linear Algebra');
      expect(text).toContain('2. Calculus');
    });

    it('extracts PDF text stream chunks', async () => {
      const pdf = `%PDF-1.4
1 0 obj
<< /Length 80 >>
stream
BT
(Chapter 1: Network Protocols) Tj
(Chapter 2: Transport Layer) Tj
ET
endstream
endobj`;
      const buf = new TextEncoder().encode(pdf);
      const text = await extractUniversalTextFromBuffer(buf, 'networks.pdf');
      expect(text).toContain('Chapter 1: Network Protocols');
      expect(text).toContain('Chapter 2: Transport Layer');
    });

    it('falls back to printable string scanning for binary data (.doc legacy)', async () => {
      const bin = new Uint8Array(120);
      bin.fill(0x02);
      const embedded = new TextEncoder().encode(
        'Course: Embedded Systems\nChapter 1: Interrupts\nChapter 2: DMA Controllers',
      );
      bin.set(embedded, 10);

      const text = await extractUniversalTextFromBuffer(bin, 'embedded.doc');
      expect(text).toContain('Course: Embedded Systems');
      expect(text).toContain('Chapter 1: Interrupts');
    });
  });
});
