import * as models from '../../../models';
import {Pagination} from '../pagination';
import requests from './requests';

export class ArchivedWorkflowsService {
    public list(namespace: string, name: string, namePrefix: string, phases: string[], labels: string[], minStartedAt: Date, maxStartedAt: Date, pagination: Pagination) {
        return requests
            .get(`api/v1/archived-workflows?${this.queryParams({namespace, name, namePrefix, phases, labels, minStartedAt, maxStartedAt, pagination}).join('&')}`)
            .then(res => res.body as models.WorkflowList);
    }

    public get(uid: string) {
        return requests.get(`api/v1/archived-workflows/${uid}`).then(res => res.body as models.Workflow);
    }

    public delete(uid: string) {
        return requests.delete(`api/v1/archived-workflows/${uid}`);
    }

    public listLabelKeys() {
        return requests.get(`api/v1/archived-workflows-label-keys`).then(res => res.body as models.Labels);
    }

    public listLabelValues(key: string) {
        return requests.get(`api/v1/archived-workflows-label-values?listOptions.labelSelector=${key}`).then(res => res.body as models.Labels);
    }

    private queryParams(filter: {
        namespace?: string;
        name?: string;
        namePrefix?: string;
        phases?: Array<string>;
        labels?: Array<string>;
        minStartedAt?: Date;
        maxStartedAt?: Date;
        pagination: Pagination;
    }) {
        const queryParams: string[] = [];
        const fieldSelector = this.fieldSelectorParams(filter.namespace, filter.name, filter.minStartedAt, filter.maxStartedAt);
        if (fieldSelector.length > 0) {
            queryParams.push(`listOptions.fieldSelector=${fieldSelector}`);
        }
        const labelSelector = this.labelSelectorParams(filter.phases, filter.labels);
        if (labelSelector.length > 0) {
            queryParams.push(`listOptions.labelSelector=${labelSelector}`);
        }
        if (filter.pagination.offset) {
            queryParams.push(`listOptions.continue=${filter.pagination.offset}`);
        }
        if (filter.pagination.limit) {
            queryParams.push(`listOptions.limit=${filter.pagination.limit}`);
        }
        if (filter.namePrefix) {
            queryParams.push(`namePrefix=${filter.namePrefix}`);
        }
        return queryParams;
    }

    private fieldSelectorParams(namespace: string, name: string, minStartedAt: Date, maxStartedAt: Date) {
        let fieldSelector = '';
        if (namespace) {
            fieldSelector += 'metadata.namespace=' + namespace + ',';
        }
        if (name) {
            fieldSelector += 'metadata.name=' + name + ',';
        }
        if (minStartedAt) {
            fieldSelector += 'spec.startedAt>' + minStartedAt.toISOString() + ',';
        }
        if (maxStartedAt) {
            fieldSelector += 'spec.startedAt<' + maxStartedAt.toISOString() + ',';
        }
        if (fieldSelector.endsWith(',')) {
            fieldSelector = fieldSelector.substr(0, fieldSelector.length - 1);
        }
        return fieldSelector;
    }

    private labelSelectorParams(phases?: Array<string>, labels?: Array<string>) {
        let labelSelector = '';
        if (phases && phases.length > 0) {
            labelSelector = `workflows.argoproj.io/phase in (${phases.join(',')})`;
        }
        if (labels && labels.length > 0) {
            if (labelSelector.length > 0) {
                labelSelector += ',';
            }
            labelSelector += labels.join(',');
        }
        return labelSelector;
    }
}
