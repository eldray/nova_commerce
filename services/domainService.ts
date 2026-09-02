import { db } from "../helpers/db";

export interface DomainValidationResult {
  isValid: boolean;
  issues: string[];
}

export class DomainService {
  static async validateDomain(domain: string): Promise<DomainValidationResult> {
    const issues: string[] = [];

    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(domain)) {
      issues.push("Invalid domain format");
      return { isValid: false, issues };
    }

    // Check if domain already exists in system
    const existing = await db
      .selectFrom("customDomains")
      .select("id")
      .where("domain", "=", domain.toLowerCase())
      .executeTakeFirst();

    if (existing) {
      issues.push("Domain already registered to another store");
    }

    // Check for reserved domains
    const reservedDomains = ["localhost", "nova-commerce", "app", "admin", "api", "www"];
    const subdomain = domain.split(".")[0].toLowerCase();
    if (reservedDomains.includes(subdomain)) {
      issues.push("This domain name is reserved");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  static async addDomain(userId: number, domain: string): Promise<any> {
    const validation = await this.validateDomain(domain);

    if (!validation.isValid) {
      throw new Error(`Invalid domain: ${validation.issues.join(", ")}`);
    }

    const verificationToken = `nv-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;

    const inserted = await db
      .insertInto("customDomains")
      .values({
        userId,
        domain: domain.toLowerCase(),
        status: "pending",
        verificationToken,
      })
      .returning(["id", "domain", "verificationToken", "status"])
      .executeTakeFirstOrThrow();

    return inserted;
  }

  static async verifyDomain(domainId: number): Promise<boolean> {
    const domainRecord = await db
      .selectFrom("customDomains")
      .select(["domain", "verificationToken", "userId"])
      .where("id", "=", domainId)
      .where("status", "=", "pending")
      .executeTakeFirst();

    if (!domainRecord) {
      return false;
    }

    const isVerified = await this.checkDNSRecords(domainRecord.domain, domainRecord.verificationToken);

    if (isVerified) {
      await db
        .updateTable("customDomains")
        .set({
          status: "verified",
          verifiedAt: new Date(),
        })
        .where("id", "=", domainId)
        .execute();

      // Update store with custom domain
      await db
        .updateTable("stores")
        .set({
          customDomain: domainRecord.domain,
          sslEnabled: true,
        })
        .where("tenantId", "=", domainRecord.userId)
        .execute();

      return true;
    }

    return false;
  }

  static async checkDNSRecords(_domain: string, _token: string): Promise<boolean> {
    try {
      return false;
    } catch {
      return false;
    }
  }

  static async getDomainByUserId(userId: number): Promise<any[]> {
    return await db
      .selectFrom("customDomains")
      .selectAll()
      .where("userId", "=", userId)
      .orderBy("createdAt", "desc")
      .execute();
  }

  static async deleteDomain(domainId: number, userId: number): Promise<void> {
    const result = await db
      .deleteFrom("customDomains")
      .where("id", "=", domainId)
      .where("userId", "=", userId)
      .executeTakeFirst();

    if (Number(result.numDeletedRows) === 0) {
      throw new Error("Domain not found or access denied");
    }
  }

  static async forceVerifyDomain(domainId: number): Promise<void> {
    await db
      .updateTable("customDomains")
      .set({
        status: "verified",
        verifiedAt: new Date(),
      })
      .where("id", "=", domainId)
      .execute();
  }
}
