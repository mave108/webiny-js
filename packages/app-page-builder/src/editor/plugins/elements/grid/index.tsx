import React from "react";
import Grid from "./Grid";
import styled from "@emotion/styled";
import { ReactComponent as GridIcon } from "@webiny/app-page-builder/editor/assets/icons/grid-6-6.svg";
import { createElementHelper } from "@webiny/app-page-builder/editor/helpers";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import {
    getDefaultPresetPluginCells,
    getDefaultPresetCellsTypePluginType
} from "@webiny/app-page-builder/editor/plugins/gridPresets";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 75
    }
});

const createDefaultCells = (cellsType: string) => {
    const cells = getDefaultPresetPluginCells(cellsType);
    return cells.map(size => {
        return createElementHelper("cell", {
            data: {
                settings: {
                    grid: {
                        size
                    }
                }
            }
        });
    });
};

const plugin: PbEditorPageElementPlugin = {
    type: "pb-editor-page-element",
    name: "pb-editor-page-element-grid",
    elementType: "grid",
    toolbar: {
        title: "Grid",
        group: "pb-editor-element-group-layout",
        preview() {
            return (
                <PreviewBox>
                    <GridIcon />
                </PreviewBox>
            );
        }
    },
    settings: [
        "pb-editor-page-element-settings-grid",
        "",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ],
    target: ["cell", "block"],
    canDelete: () => {
        return true;
    },
    create: (options = {}) => {
        const { elements, data = {} } = options;
        const { cellsType = getDefaultPresetCellsTypePluginType() } =
            data.settings?.cellsType || {};

        return {
            type: "grid",
            elements: elements || createDefaultCells(cellsType),
            data: {
                settings: {
                    width: { value: "100%" },
                    margin: {
                        mobile: { top: 15, left: 15, right: 15, bottom: 15 },
                        desktop: { top: 25, left: 0, right: 0, bottom: 25 },
                        advanced: true
                    },
                    padding: {
                        mobile: { all: 10 },
                        desktop: { all: 0 }
                    },
                    grid: {
                        cellsType
                    }
                }
            },
            ...options
        };
    },
    render({ element }) {
        return <Grid element={element} />;
    }
};

export default () => plugin;
