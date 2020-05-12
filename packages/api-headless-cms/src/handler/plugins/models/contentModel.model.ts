import { validation } from "@webiny/validation";
import {
    pipe,
    withFields,
    withProps,
    string,
    withName,
    fields,
    object,
    ref,
    withHooks,
    setOnce,
    skipOnPopulate
} from "@webiny/commodo";
import createFieldsModel from "./ContentModel/createFieldsModel";
import camelCase from "lodash/camelCase";
import pluralize from "pluralize";

const required = validation.create("required");

export default ({ createBase, context }) => {
    const ContentModelFieldsModel = createFieldsModel(context);

    const CmsContentModel = pipe(
        withName(`CmsContentModel`),
        withFields({
            name: string({
                validation: validation.create("required,maxLength:100"),
                value: "Untitled"
            }),
            modelId: setOnce()(string({ validation: validation.create("required,maxLength:100") })),
            description: string({ validation: validation.create("maxLength:200") }),
            layout: object({ value: [] }),
            group: ref({ instanceOf: context.models.CmsContentModelGroup, validation: required }),
            titleFieldId: string(),
            usedFields: skipOnPopulate()(string({ list: true, value: [] })),
            fields: fields({
                list: true,
                value: [],
                instanceOf: ContentModelFieldsModel
            })
        }),
        withProps({
            pluralizedName() {
                if (!this.name) {
                    return "";
                }

                return pluralize(this.name);
            },
            pluralizedModelId() {
                if (!this.modelId) {
                    return "";
                }

                return pluralize(this.modelId);
            }
        }),
        withHooks({
            async beforeSave() {
                const fields = this.fields || [];

                // We must not allow removal of fields that are already in use in content entries.
                const usedFields = this.usedFields || [];
                for (let i = 0; i < usedFields.length; i++) {
                    const usedFieldId = usedFields[i];
                    const fieldExists = fields.find(item => item.fieldId === usedFieldId);
                    if (!fieldExists) {
                        throw new Error(
                            `Cannot remove field "${usedFieldId}" because it's already in use in created content.`
                        );
                    }
                }

                // If no title field set, just use the first "text" field.
                let hasTitleFieldId = false;
                if (this.titleFieldId && fields.find(item => item.fieldId === this.titleFieldId)) {
                    hasTitleFieldId = true;
                }

                if (!hasTitleFieldId) {
                    this.titleFieldId = null;
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        if (field.type === "text") {
                            this.titleFieldId = field.fieldId;
                            break;
                        }
                    }
                }

                if (this.titleFieldId) {
                    const field = fields.find(item => item.fieldId === this.titleFieldId);
                    if (field.type !== "text") {
                        throw new Error("Only text fields can be used as an entry title.");
                    }
                }

                if (this.isDirty()) {
                    const removeCallback = this.hook("afterSave", async () => {
                        removeCallback();
                        const environment = context.cms.getEnvironment();
                        environment.changedOn = new Date();
                        await environment.save();
                    });
                }
            },
            async beforeCreate() {
                // If there is a modelId assigned, check if it's unique ...
                if (this.modelId) {
                    this.modelId = camelCase(this.modelId);
                    const existing = await CmsContentModel.findOne({
                        query: { modelId: this.modelId }
                    });
                    if (existing) {
                        throw Error(`Content model with modelId "${this.modelId}" already exists.`);
                    }
                    return;
                }

                // ... otherwise, assign a unique modelId automatically.
                const modelIdCamelCase = camelCase(this.name);
                let modelId;
                let counter = 0;

                while (true) {
                    modelId = modelIdCamelCase;
                    if (counter) {
                        modelId += counter;
                    }

                    const exists = await CmsContentModel.count({
                        query: { modelId },
                        limit: 1
                    });

                    if (!exists) {
                        break;
                    }

                    counter++;
                }

                this.getField("modelId").state.set = false;
                this.modelId = modelId;
            }
        })
    )(createBase());

    return CmsContentModel;
};
