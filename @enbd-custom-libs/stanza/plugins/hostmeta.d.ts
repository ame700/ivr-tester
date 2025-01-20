import { Agent } from '../';
declare module '../' {
    interface AgentConfig {
        /**
         * Allow using DNS TXT records for discovering alternate connection methods.
         *
         * **Security Considerations:**
         *
         * Connection methods discovered via DNS TXT Records do not have a chain of
         * trust, and could be poisoned by a malicious actor.
         *
         * It is NOT RECOMMENDED to enable this feature.
         *
         * @default false
         */
        allowAlternateDNSDiscovery?: boolean;
    }
    interface Agent {
        discoverBindings(server: string): Promise<{
            [key: string]: any[];
        }>;
    }
}
export default function (client: Agent): void;
