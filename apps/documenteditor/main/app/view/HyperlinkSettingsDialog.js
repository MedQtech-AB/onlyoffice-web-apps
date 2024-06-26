/*
 * (c) Copyright Ascensio System SIA 2010-2023
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */
/**
 *  HyperlinkSettingsDialog.js
 *
 *  Created by Alexander Yuzhin on 2/20/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */


if (Common === undefined)
    var Common = {};

var c_oHyperlinkType = {
    InternalLink:0,
    WebLink: 1
};

define([
    'common/main/lib/util/utils',
    'common/main/lib/component/InputField',
    'common/main/lib/component/Window'
], function () { 'use strict';

    DE.Views.HyperlinkSettingsDialog = Common.UI.Window.extend(_.extend({
        options: {
            width: 350,
            style: 'min-width: 230px;',
            cls: 'modal-dlg',
            id: 'window-hyperlink',
            buttons: ['ok', 'cancel']
        },

        initialize : function(options) {
            _.extend(this.options, {
                title: this.textTitle
            }, options || {});

            this.template = [
                '<div class="box" style="height: 319px;">',
                    '<div class="input-row" style="margin-bottom: 10px;">',
                        '<button type="button" class="btn btn-text-default auto" id="id-dlg-hyperlink-external">', this.textExternal,'</button>',
                        '<button type="button" class="btn btn-text-default auto" id="id-dlg-hyperlink-internal">', this.textInternal,'</button>',
                    '</div>',

                    '<div id="id-external-link">',
                    '<div class="input-row">',
                    '<label>' + 'Edit' + this.textUrl + '</label>',
                    '</div>',
                    '<div id="id-dlg-hyperlink-document" class="input-row" style="margin-bottom: 5px;"></div>',
                    '<div id="id-dlg-hyperlink-action" class="input-row" style="margin-bottom: 5px;"></div>',
                    '<div id="id-dlg-hyperlink-url" class="input-row" style="margin-bottom: 5px;"></div>',
                    "</div>",

                    '<div id="id-internal-link">',
                        '<div class="input-row">',
                            '<label>' + this.textUrl + '</label>',
                        '</div>',
                        '<div id="id-dlg-hyperlink-list" style="width:100%; height: 171px;"></div>',
                    '</div>',
                    '<div class="input-row">',
                        '<label>' + this.textDisplay + '</label>',
                    '</div>',
                    '<div id="id-dlg-hyperlink-display" class="input-row" style="margin-bottom: 5px;"></div>',
                    '<div class="input-row">',
                        '<label>' + this.textTooltip + '</label>',
                    '</div>',
                    '<div id="id-dlg-hyperlink-tip" class="input-row" style="margin-bottom: 5px;"></div>',
                '</div>'
            ].join('');

            this.options.tpl = _.template(this.template)(this.options);
            this.api = this.options.api;
            this._originalProps = null;
            this.urlType = AscCommon.c_oAscUrlType.Invalid;
            this.appOptions = this.options.appOptions;

            Common.UI.Window.prototype.initialize.call(this, this.options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            var me = this,
                $window = this.getChild();

            me.btnExternal = new Common.UI.Button({
                el: $('#id-dlg-hyperlink-external'),
                enableToggle: true,
                toggleGroup: 'hyperlink-type',
                allowDepress: false,
                pressed: true
            });
            me.btnExternal.on('click', _.bind(me.onLinkTypeClick, me, c_oHyperlinkType.WebLink));

            me.btnInternal = new Common.UI.Button({
                el: $('#id-dlg-hyperlink-internal'),
                enableToggle: true,
                toggleGroup: 'hyperlink-type',
                allowDepress: false
            });
            me.btnInternal.on('click', _.bind(me.onLinkTypeClick, me, c_oHyperlinkType.InternalLink));

            me.documentLinkTo = new Common.UI.ComboBox({
              el: $("#id-dlg-hyperlink-document"),
              cls: "input-group-nr",
              menuStyle: "min-width: 85px;",
              editable: false,
              data: [],
              placeHolder: "- Select Specific Document -",
              dataHint: "1",
              dataHintDirection: "bottom",
              dataHintOffset: "big",
            });
  
            me.documentLinkTo.on("selected", async function (combo, record) {
              var val = record.value;
              try {
                if (val === "Document") {
                  await me.companyDocuments(val);
                  me.connectedDocumentList.setDisabled(false);
                } else if (val === "New Document From Template") {
                  const isTemplate = true;
                  await me.companyDocuments(val);
                  me.connectedDocumentList.setDisabled(false);
                } else if (val === "Layout") {
                  await me.companyDocuments(val);
                  me.connectedDocumentList.setDisabled(false);
                } else if (val === "Case") {
                  await me.companyErrands();
                  me.connectedDocumentList.setDisabled(false);
                } else if (val === "New Layout") {
                  me.connectedDocumentList.setData([]);
                  me.connectedDocumentList.setValue("");
                  me.connectedDocumentList.setDisabled(true);
                } else if (val === "New Case") {
                  me.connectedDocumentList.setData([]);
                  me.connectedDocumentList.setValue("");
                  me.connectedDocumentList.setDisabled(true);
                } else {
                  me.connectedDocumentList.setData([]);
                  me.connectedDocumentList.setDisabled(false);
                }
                me.btnOk.setDisabled(false);
              } catch (error) {
                console.error("Error:", error);
              }
            });
  
            me.documentLinkAction = new Common.UI.ComboBox({
              el: $("#id-dlg-hyperlink-action"),
              cls: "input-group-nr",
              menuStyle: "min-width: 85px;",
              placeHolder: "- Select Document Action -",
              editable: false,
              data: [],
              dataHint: "1",
              dataHintDirection: "bottom",
              dataHintOffset: "big",
            });
  
            me.connectedDocumentList = new Common.UI.ComboBox({
              el: $("#id-dlg-hyperlink-url"),
              cls: "input-group-nr",
              menuStyle: "min-width: 85px;",
              placeHolder: "- Select -",
              editable: false,
              data: [],
              dataHint: "1",
              dataHintDirection: "bottom",
              dataHintOffset: "big",
            });
  
            me.connectedDocumentList.on("selected", function (combo, record) {
                me.isInputFirstChange && me.connectedDocumentList.showError();
                me.isInputFirstChange = false;
                var val = record.displayValue;
                Common.localStorage.setItem("editorUrl-val", JSON.stringify(val));
                if (me.isAutoUpdate) {
                    me.inputDisplay.setValue(val);
                    me.isTextChanged = true;
                }
            });

            me.inputDisplay = new Common.UI.InputField({
                el          : $('#id-dlg-hyperlink-display'),
                allowBlank  : true,
                validateOnBlur: false,
                style       : 'width: 100%;'
            }).on('changed:after', function() {
                me.isTextChanged = true;
            });
            me.inputDisplay._input.on('input', function (e) {
                me.isAutoUpdate = ($(e.target).val()=='');
            });

            me.inputTip = new Common.UI.InputField({
                el          : $('#id-dlg-hyperlink-tip'),
                style       : 'width: 100%;',
                maxLength   : Asc.c_oAscMaxTooltipLength
            });

            me.internalList = new Common.UI.TreeView({
                el: $('#id-dlg-hyperlink-list'),
                store: new Common.UI.TreeViewStore(),
                enableKeyEvents: true,
                tabindex: 1
            });
            me.internalList.on('item:select', _.bind(this.onSelectItem, this));

            me.btnOk = _.find(this.getFooterButtons(), function (item) {
                return (item.$el && item.$el.find('.primary').addBack().filter('.primary').length>0);
            }) || new Common.UI.Button({ el: $window.find('.primary') });

            $window.find('.dlg-btn').on('click', _.bind(this.onBtnClick, this));
            me.internalList.on('entervalue', _.bind(me.onPrimary, me));
            me.externalPanel = $window.find('#id-external-link');
            me.internalPanel = $window.find('#id-internal-link');
        },

        getFocusedComponents: function() {
            return [this.btnExternal, this.btnInternal, this.connectedDocumentList, this.documentLinkTo, this.documentLinkAction,, this.internalList, this.inputDisplay, this.inputTip].concat(this.getFooterButtons());
        },

        ShowHideElem: function(value) {
            this.externalPanel.toggleClass('hidden', value !== c_oHyperlinkType.WebLink);
            this.internalPanel.toggleClass('hidden', value !== c_oHyperlinkType.InternalLink);
            var store = this.internalList.store;
            if (value==c_oHyperlinkType.InternalLink) {
                if (store.length<1) {
                    var anchors = this.api.asc_GetHyperlinkAnchors(),
                        count = anchors.length,
                        prev_level = 0,
                        header_level = 0,
                        arr = [];
                    arr.push(new Common.UI.TreeViewModel({
                        name : this.txtBeginning,
                        level: 0,
                        index: 0,
                        hasParent: false,
                        isEmptyItem: false,
                        isNotHeader: true,
                        hasSubItems: false
                    }));
                    arr.push(new Common.UI.TreeViewModel({
                        name : this.txtHeadings,
                        level: 0,
                        index: 1,
                        hasParent: false,
                        isEmptyItem: false,
                        isNotHeader: false,
                        type: Asc.c_oAscHyperlinkAnchor.Heading,
                        hasSubItems: false
                    }));

                    for (var i=0; i<count; i++) {
                        var anchor = anchors[i],
                            level = anchors[i].asc_GetHeadingLevel()+1,
                            hasParent = true;
                        if (anchor.asc_GetType()== Asc.c_oAscHyperlinkAnchor.Heading){
                            if (level>prev_level)
                                arr[arr.length-1].set('hasSubItems', true);
                            if (level<=header_level) {
                                header_level = level;
                                hasParent = false;
                            }
                            arr.push(new Common.UI.TreeViewModel({
                                name : anchor.asc_GetHeadingText(),
                                level: level,
                                index: i+2,
                                hasParent: hasParent,
                                type: Asc.c_oAscHyperlinkAnchor.Heading,
                                headingParagraph: anchor.asc_GetHeadingParagraph()
                            }));
                            prev_level = level;
                        }
                    }
                    arr.push(new Common.UI.TreeViewModel({
                        name : this.txtBookmarks,
                        level: 0,
                        index: arr.length,
                        hasParent: false,
                        isEmptyItem: false,
                        isNotHeader: false,
                        type: Asc.c_oAscHyperlinkAnchor.Bookmark,
                        hasSubItems: false
                    }));

                    prev_level = 0;
                    for (var i=0; i<count; i++) {
                        var anchor = anchors[i],
                            hasParent = true;
                        if (anchor.asc_GetType()== Asc.c_oAscHyperlinkAnchor.Bookmark){
                            if (prev_level<1)
                                arr[arr.length-1].set('hasSubItems', true);
                            arr.push(new Common.UI.TreeViewModel({
                                name : anchor.asc_GetBookmarkName(),
                                level: 1,
                                index: arr.length,
                                hasParent: false,
                                type: Asc.c_oAscHyperlinkAnchor.Bookmark
                            }));
                            prev_level = 1;
                        }
                    }
                    store.reset(arr);
                    this.internalList.collapseAll();
                }
                var rec = this.internalList.getSelectedRec();
                this.btnOk.setDisabled(false);
                var me = this;
                _.delay(function(){
                    me.inputDisplay.focus();
                },50);
            } else {
                this.btnOk.setDisabled($.trim(this.connectedDocumentList.getValue())=='');
                var me = this;
                _.delay(function(){
                    me.connectedDocumentList.focus();
                },50);
            }
        },

        documentLinkToTypes: async function () {
          var me = this;
          this.token = Common.localStorage.getItem("token");
          this.getDocumentLinkToTypes = Common.localStorage.getItem(
            "getDocumentLinkToTypes"
          );

          // Fetch data from the server
          const response = await fetch(this.getDocumentLinkToTypes, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          });
          if (!response.ok) {
            throw new Error("Failed to fetch data");
          }
          const finalDocumentLinkToType = await response.json();
          // Set the data for me.inputUrl
          me.documentLinkTo.setData(finalDocumentLinkToType);
        },

        documentActionTypes: async function () {
          var me = this;
          this.token = Common.localStorage.getItem("token");
          this.getDocumentActionTypes = Common.localStorage.getItem(
            "getDocumentActionTypes"
          );
          // Fetch data from the server
          const response = await fetch(this.getDocumentActionTypes, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          });
          if (!response.ok) {
            throw new Error("Failed to fetch data");
          }
          const documentActionTypes = await response.json();
          // Set the data for me.inputUrl
          me.documentLinkAction.setData(documentActionTypes);
        },

        companyErrands: async function () {
          var me = this;
          this.token = Common.localStorage.getItem("token");
          this.getErrandUrl = Common.localStorage.getItem("getErrandUrl");
          // Fetch data from the server
          const response = await fetch(this.getErrandUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          });

          if (!response.ok) {
            me.connectedDocumentList.setData([]);
            throw new Error("Failed to fetch data");
          }
          const data = await response.json();
          // Process the data
          const finalErrandData = data.map((item) => ({
            displayValue: item.id,
            defaultValue: item.id,
            value: item.id,
          }));
          // Set the data for me.inputUrl
          me.connectedDocumentList.setData(finalErrandData);
        },

        companyDocuments: async function (documentLinkTo) {
          var me = this;
          this.token = Common.localStorage.getItem("token");
          this.getDocumentUrl = Common.localStorage.getItem("getDocumentUrl");
          // Fetch data from the server
          const url = `${this.getDocumentUrl}/${documentLinkTo}`;

          const response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          });
          if (!response.ok) {
            throw new Error("Failed to fetch data");
          }
          const data = await response.json();
          // Process the data
          const finalDocumentData = data.map((item) => ({
            displayValue: item.title,
            defaultValue: item.title,
            value: item.id,
          }));
          // Set the data for me.connectedDocumentList
          me.connectedDocumentList.setData(finalDocumentData);
        },

        onLinkTypeClick: function(type, btn, event) {
            this.ShowHideElem(type);
            if (this.isAutoUpdate) {
                if (type==c_oHyperlinkType.InternalLink) {
                    var rec = this.internalList.getSelectedRec();
                    this.inputDisplay.setValue(rec && (rec.get('level') || rec.get('index')==0)? rec.get('name') : '');
                } else {
                    this.inputDisplay.setValue(this.connectedDocumentList.getValue());
                }
                this.isTextChanged = true;
            }
        },

        onSelectItem: function(picker, item, record, e){
            this.btnOk.setDisabled(false);
            if (this.isAutoUpdate) {
                this.inputDisplay.setValue((record.get('level') || record.get('index')==0) ? record.get('name') : '');
                this.isTextChanged = true;
            }
        },

        show: function() {
            Common.UI.Window.prototype.show.apply(this, arguments);
        },

        close: function () {
          Common.UI.Window.prototype.close.apply(this, arguments);
          Common.localStorage.removeItem("documentLinkId");
          Common.localStorage.removeItem("link_Id");
        },

        demoLink: async function () {
          var me = this,
            props = new Asc.CHyperlinkProperty(),
            display = "",
            type = this.btnExternal.isActive()
              ? c_oHyperlinkType.WebLink
              : c_oHyperlinkType.InternalLink;

          if (type == c_oHyperlinkType.WebLink) {
            const documentLinkId = Number(
              Common.localStorage.getItem("documentLinkId")
            );
            if (documentLinkId) {
              const data = await this.updateLink(documentLinkId);
              this.originUrl = Common.localStorage.getItem("originUrl");
              var url = `${this.originUrl}/${data.id}`;
            } else {
              const data = await this.createLink();

              this.originUrl = Common.localStorage.getItem("originUrl");
              var url = `${this.originUrl}/${data.id}`;
            }

            if (
              me.urlType !== AscCommon.c_oAscUrlType.Unsafe &&
              !/(((^https?)|(^ftp)):\/\/)|(^mailto:)/i.test(url)
            )
              // url =
              //   (me.urlType == AscCommon.c_oAscUrlType.Email
              //     ? "mailto:"
              //     : "http://") + url;

              url = url.replace(new RegExp("%20", "g"), " ");
            props.put_Value(url);
            props.put_Bookmark(null);
            display = url;
          } else {
            var rec = this.internalList.getSelectedRec();
            if (rec) {
              props.put_Bookmark(rec.get("name"));
              if (rec.get("index") == 0) props.put_TopOfDocument();
              var para = rec.get("headingParagraph");
              if (para) props.put_Heading(para);
              display = rec.get("name");
            }
          }

          if (
            !me.inputDisplay.isDisabled() &&
            (me.isTextChanged || _.isEmpty(me.inputDisplay.getValue()))
          ) {
            if (
              _.isEmpty(me.inputDisplay.getValue()) ||
              (type == c_oHyperlinkType.WebLink && me.isAutoUpdate)
            )
              me.inputDisplay.setValue(display);
            props.put_Text(me.inputDisplay.getValue());
          } else {
            props.put_Text(null);
          }

          props.put_ToolTip(me.inputTip.getValue());
          props.put_InternalHyperlink(
            me._originalProps.get_InternalHyperlink()
          );

          return props;
        },
        createLink: async function () {
          this.token = Common.localStorage.getItem("token");
          this.linkUrl = Common.localStorage.getItem("linkUrl");
          this.documentId = Common.localStorage.getItem("documentId");

          return await fetch(this.linkUrl, {
            method: "POST",
            body: JSON.stringify({
              link_to: this.documentLinkTo.getValue() || "Document",
              id_of_to: Number(this.connectedDocumentList.getValue()),
              action: this.documentLinkAction.getValue() || "New Tab",
              document_id: Number(this.documentId),
            }),
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json;charset=UTF-8",
              Authorization: `Bearer ${this.token}`,
            },
          })
            .then((res) => res.json())
            .then(async (data) => {
              return await data;
            })
            .catch((err) => {
              console.log(err, "err");
            });
        },

        updateLink: async function (documentLinkId) {
          this.token = Common.localStorage.getItem("token");
          this.linkUrl = Common.localStorage.getItem("linkUrl");
          this.documentId = Common.localStorage.getItem("documentId");

          return await fetch(`${this.linkUrl}/update`, {
            method: "POST",
            body: JSON.stringify({
              id: documentLinkId,
              link_to: this.documentLinkTo.getValue() || "Document",
              id_of_to: Number(this.connectedDocumentList.getValue()),
              action: this.documentLinkAction.getValue() || "New Tab",
              document_id: Number(this.documentId),
            }),
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json;charset=UTF-8",
              Authorization: `Bearer ${this.token}`,
            },
          })
            .then((res) => res.json())
            .then(async (data) => {
              Common.localStorage.removeItem("documentLinkId");
              return await data;
            })
            .catch((err) => {
              console.log(err, "err");
            });
        },

        linkData: async function (linkId) {
          Common.localStorage.setItem("link_Id", JSON.stringify(linkId));
          this.token = Common.localStorage.getItem("token");
          this.linkUrl = Common.localStorage.getItem("linkUrl");
          return await fetch(`${this.linkUrl}/link?linkId=${linkId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          })
            .then((response) => response.json())
            .then((linkData) => {
              return linkData;
            })
            .catch((error) => {
              console.error("Error fetching data:", error);
            });
        },

        setSettings: async function (props) {
            if (props) {
                var me = this;

                await me.documentLinkToTypes();
                await me.documentActionTypes();

                var bookmark = props.get_Bookmark(),
                    type = (bookmark === null || bookmark=='') ? ((props.get_Value() || !Common.Utils.InternalSettings.get("de-settings-link-type")) ? c_oHyperlinkType.WebLink : c_oHyperlinkType.InternalLink) : c_oHyperlinkType.InternalLink;

                (type == c_oHyperlinkType.WebLink) ? me.btnExternal.toggle(true) : me.btnInternal.toggle(true);
                me.ShowHideElem(type);

                if (type == c_oHyperlinkType.WebLink) {
                    if (props.get_Value()) {
                        const urlString = props.get_Value();
                        const connectionDocumentUrl = urlString;
                        const splitConnectionDocumentUrl =
                            connectionDocumentUrl.split("/");
                        const linkId =
                            splitConnectionDocumentUrl[
                            splitConnectionDocumentUrl.length - 1
                            ];
        
                        if (linkId) {
                            const number = parseInt(linkId);
        
                            await this.linkData(number).then(async (documentLinkData) => {
                            Common.localStorage.setItem(
                                "documentLinkId",
                                JSON.stringify(documentLinkData.id)
                            );
        
                            const linkTo = documentLinkData.link_to;
        
                            if (documentLinkData.link_to === "Case") {
                                await me.companyErrands();
                                if (
                                documentLinkData.link_document &&
                                documentLinkData.link_document.id
                                ) {
                                me.connectedDocumentList.setValue(
                                    documentLinkData.link_document.id
                                );
                                } else {
                                me.connectedDocumentList.setValue("");
                                }
                            } else if (
                                linkTo === "Document" ||
                                linkTo === "New Document From Template" ||
                                linkTo === "Layout"
                            ) {
                                await me.companyDocuments(linkTo);
                                if (
                                documentLinkData.link_document &&
                                documentLinkData.link_document.title
                                ) {
                                me.connectedDocumentList.setValue(
                                    documentLinkData.link_document.title
                                );
                                } else {
                                me.connectedDocumentList.setValue("");
                                }
                            } else if (documentLinkData.link_to === "New Layout") {
                                me.connectedDocumentList.setData([]);
                                me.connectedDocumentList.setValue("");
                                me.connectedDocumentList.setDisabled(true);
                            }
                            if (linkTo === "New Case") {
                                me.connectedDocumentList.setData([]);
                                me.connectedDocumentList.setValue("");
                                me.connectedDocumentList.setDisabled(true);
                            }
                            me.documentLinkTo.setValue(documentLinkData.link_to || "");
                            me.documentLinkAction.setValue(
                                documentLinkData.action || ""
                            );
                            });
                        } else {
                            console.log("No match found");
                        }
                    } else {
                      me.connectedDocumentList.setValue(
                        me.connectedDocumentList.value
                      );
                    }
                    this.btnOk.setDisabled(false);
                } else {
                    if (props.is_TopOfDocument())
                        this.internalList.selectByIndex(0);
                    else if (props.is_Heading()) {
                        var rec = this.internalList.store.findWhere({type: Asc.c_oAscHyperlinkAnchor.Heading, headingParagraph: props.get_Heading() });
                        if (rec) {
                            this.internalList.expandRecord(this.internalList.store.at(1));
                            this.internalList.scrollToRecord(this.internalList.selectRecord(rec));
                        }
                    } else {
                        var rec = this.internalList.store.findWhere({type: Asc.c_oAscHyperlinkAnchor.Bookmark, name: bookmark});
                        if (rec) {
                            this.internalList.expandRecord(this.internalList.store.findWhere({type: Asc.c_oAscHyperlinkAnchor.Bookmark, level: 0}));
                            this.internalList.scrollToRecord(this.internalList.selectRecord(rec));
                        }
                    }
                    var rec = this.internalList.getSelectedRec();
                    this.btnOk.setDisabled(false);
                }

                if (props.get_Text() !== null) {
                    me.inputDisplay.setValue(props.get_Text());
                    me.inputDisplay.setDisabled(false);
                    me.isAutoUpdate = (me.inputDisplay.getValue()=='' || type == c_oHyperlinkType.WebLink && me.connectedDocumentList.getValue()==me.inputDisplay.getValue());
                } else {
                    me.inputDisplay.setValue(this.textDefault);
                    me.inputDisplay.setDisabled(true);
                }

                this.isTextChanged = false;

                me.inputTip.setValue(props.get_ToolTip());
                me._originalProps = props;
            }
        },

        getSettings: function () {
          return {};
        },

        onBtnClick: function(event) {
            this._handleInput(event.currentTarget.attributes['result'].value);
        },

        onPrimary: function(event) {
            this._handleInput('ok');
            return false;
        },

        _handleInput: async function(state) {
            if (this.options.handler) {
                if (state == 'ok') {
                    if (this.btnExternal.isActive()) {//WebLink
                        //Because of below code inputUrl not working
                        // if (this.inputUrl.checkValidate() !== true)  {
                        //     this.isInputFirstChange = true;
                        //     this.inputUrl.focus();
                        //     return;
                        // }
                    } else {
                        var rec = this.internalList.getSelectedRec();
                        if (!rec || rec.get('level')==0 && rec.get('index')>0)
                            return;
                    }
                    if (this.inputDisplay.checkValidate() !== true) {
                        this.inputDisplay.focus();
                        return;
                    }
                    (!this._originalProps.get_Bookmark() && !this._originalProps.get_Value()) &&  Common.Utils.InternalSettings.set("de-settings-link-type", this.btnInternal.isActive()); // save last added hyperlink
                  
                    const props = await this.demoLink();
                    this.options.handler.call(this, this, state, props);
                } else {
                    this.options.handler.call(this, this, state);
                }
            }

            this.close();
        },

        onSelectFile: function() {
            var me = this;
            if (me.api) {
                var callback = function(result) {
                    if (result) {
                        // me.inputUrl.setValue(result);
                        // if (me.inputUrl.checkValidate() !== true)
                        //     me.isInputFirstChange = true;
                        // if (me.isAutoUpdate) {
                        //     me.inputDisplay.setValue(result);
                        //     me.isTextChanged = true;
                        // }
                        me.btnOk.setDisabled($.trim(result)=='');
                    }
                };

                me.api.asc_getFilePath(callback); // change sdk function
            }
        },

        textUrl:            'Link to',
        textDisplay:        'Display',
        txtEmpty:           'This field is required',
        txtNotUrl:          'This field should be a URL in the format \"http://www.example.com\"',
        textTooltip:        'ScreenTip text',
        textDefault:        'Selected text',
        textTitle:          'Hyperlink Settings',
        textExternal:       'External Link',
        textInternal:       'Place in Document',
        txtBeginning: 'Beginning of document',
        txtHeadings: 'Headings',
        txtBookmarks: 'Bookmarks',
        txtSizeLimit: 'This field is limited to 2083 characters',
        txtUrlPlaceholder: 'Enter the web address or select a file',
        textSelectFile: 'Select file'
    }, DE.Views.HyperlinkSettingsDialog || {}))
});