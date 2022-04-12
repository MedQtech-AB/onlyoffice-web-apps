/*
 *
 * (c) Copyright Ascensio System SIA 2010-2020
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
 * You can contact Ascensio System SIA at 20A-12 Ernesta Birznieka-Upisha
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
 *  ViewTab.js
 *
 *  Created by Julia Svinareva on 25.02.2022
 *  Copyright (c) 2022 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'common/main/lib/view/SearchPanel'
], function () {
    'use strict';

    PE.Controllers.Search = Backbone.Controller.extend(_.extend({
        sdkViewName : '#id_main',

        views: [
            'Common.Views.SearchPanel'
        ],

        initialize: function () {
            this.addListeners({
                'SearchBar': {
                    'search:back': _.bind(this.onSearchNext, this, 'back'),
                    'search:next': _.bind(this.onSearchNext, this, 'next'),
                    'search:input': _.bind(this.onInputSearchChange, this),
                    'search:keydown': _.bind(this.onSearchNext, this, 'keydown')
                },
                'Common.Views.SearchPanel': {
                    'search:back': _.bind(this.onSearchNext, this, 'back'),
                    'search:next': _.bind(this.onSearchNext, this, 'next'),
                    'search:replace': _.bind(this.onQueryReplace, this),
                    'search:replaceall': _.bind(this.onQueryReplaceAll, this),
                    'search:input': _.bind(this.onInputSearchChange, this),
                    'search:options': _.bind(this.onChangeSearchOption, this),
                    'search:keydown': _.bind(this.onSearchNext, this, 'keydown'),
                    'show': _.bind(this.onShowPanel, this),
                    'hide': _.bind(this.onHidePanel, this),
                },
                'LeftMenu': {
                    'search:aftershow': _.bind(this.onShowAfterSearch, this)
                }
            });
        },
        onLaunch: function () {
            this._state = {
                searchText: '',
                matchCase: false,
                matchWord: false,
                useRegExp: false
            };
        },

        setMode: function (mode) {
            this.view = this.createView('Common.Views.SearchPanel', { mode: mode });
        },

        setApi: function (api) {
            if (api) {
                this.api = api;
                this.api.asc_registerCallback('asc_onSetSearchCurrent', _.bind(this.onUpdateSearchCurrent, this));
                this.api.asc_registerCallback('asc_onStartTextAroundSearch', _.bind(this.onStartTextAroundSearch, this));
                this.api.asc_registerCallback('asc_onEndTextAroundSearch', _.bind(this.onEndTextAroundSearch, this));
                this.api.asc_registerCallback('asc_onGetTextAroundSearchPack', _.bind(this.onApiGetTextAroundSearch, this));
                this.api.asc_registerCallback('asc_onRemoveTextAroundSearch', _.bind(this.onApiRemoveTextAroundSearch, this));
            }
            return this;
        },

        getView: function(name) {
            return !name && this.view ?
                this.view : Backbone.Controller.prototype.getView.call(this, name);
        },

        onChangeSearchOption: function (option, checked) {
            switch (option) {
                case 'case-sensitive':
                    this._state.matchCase = checked;
                    break;
                case 'match-word':
                    this._state.matchWord = checked;
                    break;
                case 'regexp':
                    this._state.useRegExp = checked;
                    break;
            }
            if (this._state.searchText !== '' && this.onQuerySearch()) {
                this.hideResults();
                clearInterval(this.searchTimer);
                this.searchTimer = undefined;
                this.api.asc_StartTextAroundSearch();
            }
        },

        onSearchNext: function (type, text, e) {
            if (text && text.length > 0 && (type === 'keydown' && e.keyCode === Common.UI.Keys.RETURN || type !== 'keydown')) {
                this._state.searchText = text;
                if (this.onQuerySearch(type) && this.searchTimer) {
                    this.hideResults();
                    clearInterval(this.searchTimer);
                    this.searchTimer = undefined;
                    if (this.view.$el.is(':visible')) {
                        this.api.asc_StartTextAroundSearch();
                    }
                }
            }
        },

        onInputSearchChange: function (text) {
            var me = this;
            if (this._state.searchText !== text) {
                this._state.newSearchText = text;
                this._lastInputChange = (new Date());
                if (this.searchTimer === undefined) {
                    this.searchTimer = setInterval(function(){
                        if ((new Date()) - me._lastInputChange < 400) return;

                        me.hideResults();
                        me._state.searchText = me._state.newSearchText;
                        if (me._state.newSearchText !== '' && me.onQuerySearch()) {
                            if (me.view.$el.is(':visible')) {
                                me.api.asc_StartTextAroundSearch();
                            }
                            me.view.disableReplaceButtons(false);
                        } else if (me._state.newSearchText === '') {
                            me.view.updateResultsNumber('no-results');
                            me.view.disableReplaceButtons(true);
                        }
                        clearInterval(me.searchTimer);
                        me.searchTimer = undefined;
                    }, 10);
                }
            }
        },

        onQuerySearch: function (d, w) {
            var searchSettings = new AscCommon.CSearchSettings();
            searchSettings.put_Text(this._state.searchText);
            searchSettings.put_MatchCase(this._state.matchCase);
            searchSettings.put_WholeWords(this._state.matchWord);
            if (!this.api.asc_findText(searchSettings, d != 'back')) {
                this.resultItems = [];
                this.view.updateResultsNumber(undefined, 0);
                this.view.disableReplaceButtons(true);
                this._state.currentResult = 0;
                this._state.resultsNumber = 0;
                this.view.disableNavButtons();
                return false;
            }
            return true;
        },

        onQueryReplace: function(textSearch, textReplace) {
            if (textSearch !== '') {
                var searchSettings = new AscCommon.CSearchSettings();
                searchSettings.put_Text(textSearch);
                searchSettings.put_MatchCase(this._state.matchCase);
                searchSettings.put_WholeWords(this._state.matchWord);
                if (!this.api.asc_replaceText(searchSettings, textReplace, false)) {
                    this.resultItems = [];
                    this.view.updateResultsNumber(undefined, 0);
                    this.view.disableReplaceButtons(true);
                    this._state.currentResult = 0;
                    this._state.resultsNumber = 0;
                    this.view.disableNavButtons();
                }
            }
        },

        onQueryReplaceAll: function(textSearch, textReplace) {
            if (textSearch !== '') {
                var searchSettings = new AscCommon.CSearchSettings();
                searchSettings.put_Text(textSearch);
                searchSettings.put_MatchCase(this._state.matchCase);
                searchSettings.put_WholeWords(this._state.matchWord);
                this.api.asc_replaceText(searchSettings, textReplace, true);

                this.hideResults();
                this.resultItems = [];
            }
        },

        onUpdateSearchCurrent: function (current, all) {
            if (current === -1) return;
            this._state.currentResult = current;
            this._state.resultsNumber = all;
            if (this.view) {
                this.view.updateResultsNumber(current, all);
                this.view.disableNavButtons(current, all);
                if (this.resultItems.length > 0) {
                    this.resultItems.forEach(function (item) {
                        item.selected = false;
                    });
                    if (this.resultItems[current]) {
                        this.resultItems[current].selected = true;
                        $('#search-results').find('.item').removeClass('selected');
                        $(this.resultItems[current].el).addClass('selected');
                        this.scrollToSelectedResult(current);
                    }
                }
            }
            Common.NotificationCenter.trigger('search:updateresults', current, all);
        },

        scrollToSelectedResult: function (ind) {
            var index = ind !== undefined ? ind : _.findIndex(this.resultItems, {selected: true});
            if (index !== -1) {
                var item = this.resultItems[index].$el,
                    itemHeight = item.outerHeight(),
                    itemTop = item.position().top,
                    container = this.view.$resultsContainer,
                    containerHeight = container.outerHeight(),
                    containerTop = container.scrollTop();
                if (itemTop < 0 || (containerTop === 0 && itemTop > containerHeight)) {
                    container.scroller.scrollTop(containerTop + itemTop - 12);
                } else if (itemTop + itemHeight > containerHeight) {
                    container.scroller.scrollTop(containerTop + itemHeight);
                }
            }
        },

        onStartTextAroundSearch: function () {
            if (this.view) {
                this._state.isStartedAddingResults = true;
            }
        },

        onEndTextAroundSearch: function () {
            if (this.view) {
                this._state.isStartedAddingResults = false;
                this.view.$resultsContainer.scroller.update({alwaysVisibleY: true});
            }
        },

        onApiGetTextAroundSearch: function (data) {
            if (this.view && this._state.isStartedAddingResults) {
                if (data.length > 300) return;
                var me = this;
                me.resultItems = [];
                data.forEach(function (item, ind) {
                    var el = document.createElement("div"),
                        isSelected = ind === me._state.currentResult;
                    el.className = 'item';
                    el.innerHTML = item[1].trim();
                    me.view.$resultsContainer.append(el);
                    if (isSelected) {
                        $(el).addClass('selected');
                    }

                    var resultItem = {id: item[0], $el: $(el), el: el, selected: isSelected};
                    me.resultItems.push(resultItem);
                    $(el).on('click', _.bind(function (el) {
                        var id = item[0];
                        me.api.asc_SelectSearchElement(id);
                    }, me));
                });

                this.view.$resultsContainer.show();
            }
        },

        onApiRemoveTextAroundSearch: function (arr) {
            var me = this;
            arr.forEach(function (id) {
                var ind = _.findIndex(me.resultItems, {id: id});
                if (ind !== -1) {
                    me.resultItems[ind].$el.remove();
                    me.resultItems.splice(ind, 1);
                }
            });
        },

        hideResults: function () {
            if (this.view) {
                this.view.$resultsContainer.hide();
                this.view.$resultsContainer.empty();
            }
        },

        onShowAfterSearch: function (findText) {
            var viewport = this.getApplication().getController('Viewport');
            if (viewport.isSearchBarVisible()) {
                viewport.searchBar.hide();
            }

            var text = findText || this.api.asc_GetSelectedText() || this._state.searchText;
            if (text) {
                this.view.setFindText(text);
            } else if (text !== undefined) {
                this.view.setFindText('');
            }

            this.hideResults();
            if (text !== '' && text === this._state.searchText) { // search was made
                this.view.disableReplaceButtons(false);
                this.api.asc_StartTextAroundSearch();
            } else if (text !== '') { // search wasn't made
                this.onInputSearchChange(text);
            } else {
                this.resultItems = [];
                this.view.disableReplaceButtons(true);
                this.view.clearResultsNumber();
            }
            this.view.disableNavButtons(this._state.currentResult, this._state.resultsNumber);
        },

        onShowPanel: function () {
            if (this.resultItems && this.resultItems.length > 0 && !this._state.isStartedAddingResults) {
                var me = this;
                this.view.$resultsContainer.show();
                this.resultItems.forEach(function (item) {
                    me.view.$resultsContainer.append(item.el);
                    if (item.selected) {
                        $(item.el).addClass('selected');
                    }
                    $(item.el).on('click', function (el) {
                        me.api.asc_SelectSearchElement(item.id);
                        $('#search-results').find('.item').removeClass('selected');
                        $(el.currentTarget).addClass('selected');
                    });
                });
                this.scrollToSelectedResult();
            }
        },

        onHidePanel: function () {
            this.hideResults();
        },

        notcriticalErrorTitle: 'Warning',
        warnReplaceString: '{0} is not a valid special character for the Replace With box.'

    }, PE.Controllers.Search || {}));
});