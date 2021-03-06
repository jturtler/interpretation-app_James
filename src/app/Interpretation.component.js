
import React from 'react';
import { Dialog, FlatButton } from 'material-ui';
import MessageOwner from './MessageOwner.component';
import CommentArea from './CommentArea.component';
import { getInstance as getD2 } from 'd2/lib/d2';

import actions from './actions/Interpretation.action';

const Interpretation = React.createClass({
    propTypes: {
        data: React.PropTypes.object,
        currentUser: React.PropTypes.object,
        deleteInterpretationSuccess: React.PropTypes.func,
    },

    getInitialState() {
        return {
            text: this.props.data.text,
            likes: this.props.data.likes,
            likedBy: this.props.data.likedBy,
            open: false,
            comments: this.props.data.comments.reverse(),
        };
    },

    componentDidMount() {
        const currentUserId = this.props.currentUser.id;
        for (let i = 0; i < this.props.data.likedBy.length; i++) {
            if (currentUserId === this.props.data.likedBy[i].id) {
                const likeLinkTagId = `likeLink_${this.props.data.id}`;
                $(`#${likeLinkTagId}`).replaceWith("<span class='disabledLink'>Like</span>");
            }
        }

        const divId = this.props.data.id;

        if (this.props.data.type === 'REPORT_TABLE') {
            this._setReportTable();
        } else if (this.props.data.type === 'CHART') {
            this._setChart();
        } else if (this.props.data.type === 'MAP') {
           actions.getMap('', this.props.data.map.id).subscribe(result => {
                $(`#${divId}`).css('height', '308px');
                DHIS.getMap(this._setMapOptions(result));
           });
        }
    },

    _findItemFromList(listData, searchProperty, searchValue) {
        let foundData;

        for (let i = 0; i < listData.length; i++) {
            const item = listData[i];
            if (item[searchProperty] === searchValue) {
                foundData = item;
                return false;
            }
        }

        return foundData;
    },

    _setChart() {
        const id = this.props.data.objId;
        const divId = this.props.data.id;

        getD2().then(d2 => {
            const options = {};
            options.uid = id;
            options.el = divId;
            options.id = id;
            options.url = d2.Api.getApi().baseUrl.replace('api', '');
            options.width = 600;
            options.height = 400;
            options.relativePeriodDate = this.props.data.created;

            DHIS.getChart(options);
        });
    },

    _setReportTable() {
        const id = this.props.data.objId;
        const divId = this.props.data.id;

        getD2().then(d2 => {
            const options = {};

            options.el = divId;
            options.id = id;
            options.url = d2.Api.getApi().baseUrl.replace('api', '');
            options.width = 600;
            options.height = 400;
            options.displayDensity = 'compact';
            options.relativePeriodDate = this.props.data.created;

            DHIS.getTable(options);
            $(`#${divId}`).closest('.interpretationItem ').addClass('contentTable');
            $(`#${divId}`).css('height', '400px');
        });
    },

    relativePeriodKeys: ['THIS_MONTH', 'LAST_MONTH', 'LAST_3_MONTHS', 'LAST_6_MONTHS', 'LAST_12_MONTHS', 'THIS_YEAR', 'LAST_YEAR', 'LAST_5_YEARS'],

    _setMapOptions(data) {
        const id = this.props.data.objId;
        const divId = this.props.data.id;
        const createdDate = this.props.data.created;

        const options = {};

        options.el = divId;
        //options.id = id;
        options.url = '../../..';
        options.width = 600;
        options.height = 400;
        // options.relativePeriodDate = this.props.data.created;

        options.mapViews = data.mapViews;

        for (let i = 0; i < data.mapViews.length; i++) {
            const mapView = data.mapViews[i];
            if (this._findItemFromList(mapView.filters, 'dimension', 'pe') !== undefined) {
                let relativePeriods = [];
                for (let j = 0; j < mapView.filters.length; j++) {
                    const items = mapView.filters[j].items;
                    for (let k = 0; k < items.length; k++) {
                        if (this.relativePeriodKeys.indexOf(items[k].id) >= 0) {
                            relativePeriods = relativePeriods.concat(this._converRelativePeriods(items[k].id, createdDate));
                        }
                    }
                    if (relativePeriods.length > 0) {
                        options.mapViews[i].filters[j].items = relativePeriods;
                    }
                }
            }
        }

       /* for (let i = 0; i < data.mapViews.length; i++) {
            const mapView = data.mapViews[i];
            const relativePeriodKeys = mapView.relativePeriods;
            const periods = this._converRelativePeriods(relativePeriodKeys, createdDate);

            for (const key in relativePeriodKeys) {
                if (relativePeriodKeys[key]) {
                    mapView.relativePeriods[key] = false;
                }
            }

            relativePeriods = relativePeriods.concat(periods);

            if (relativePeriods.length > 0) {
                options.mapViews[i].periods = relativePeriods;
            }
        } */

        

        return options;
    },

    _convertToNumber(n) {
        return (n.startsWith('0')) ? eval(n[1]) : eval(n);
    },

    _converRelativePeriods(relativePeriodKey, createdDate) {
        let periods = [];

        const created = createdDate.substring(0, 10).split('-');
        let month = this._convertToNumber(created[1]);
        month = month - 1;
        const day = this._convertToNumber(created[2]);
        const date = new Date(created[0], month, day);

        const currentYear = date.getFullYear();

        // Yearly periods
        if (relativePeriodKey === 'THIS_YEAR') {
            periods.push({ id: currentYear.toString(), name: currentYear.toString() });
        }
        if (relativePeriodKey === 'LAST_YEAR') {
            const lastYear = currentYear - 1;
            periods.push({ id: lastYear.toString(), name: lastYear.toString() });
        }
        if (relativePeriodKey === 'LAST_5_YEARS') {
            const start = currentYear - 5;
            const end = currentYear - 1;
            for (let year = start; year >= end; year++) {
                periods.push({ id: year.toString(), name: year.toString() });
            }
        }
        // Monthy periods
        if (relativePeriodKey === 'THIS_MONTH') {
            let currentMonth = date.getMonth() + 1;// Month from Date Object starts from 0
            currentMonth = (currentMonth > 10) ? currentMonth : `0${currentMonth}`;
            const period = `${currentYear}${currentMonth}`;
            periods.push({ id: period, name: period });
        }
        if (relativePeriodKey === 'LAST_MONTH') {
            let currentMonth = date.getMonth();// Month from Date Object starts from 0
            currentMonth = (currentMonth > 10) ? currentMonth : `0${currentMonth}`;
            periods.push({ id: `${currentYear}${currentMonth}`, name: `${currentYear}${currentMonth}` });
        }
        /* if (relativePeriodKey === 'monthsThisYear') {
            const currentMonth = date.getMonth();// Month from Date Object starts from 0
            for (let m = 1; m <= currentMonth; m++) {
                const k = (m > 10) ? m : `0${m}`;
                periods.push({ id: `${currentYear}${k}` });
            }
        } */
        if (relativePeriodKey === 'LAST_3_MONTHS') {
            periods = periods.concat(this._getLastNMonth(12, currentYear, date.getMonth()));
        }
        if (relativePeriodKey === 'LAST_3_MONTHS') {
            periods = periods.concat(this._getLastNMonth(3, currentYear, date.getMonth()));
        }
        if (relativePeriodKey === 'LAST_6_MONTHS') {
            periods = periods.concat(this._getLastNMonth(6, currentYear, date.getMonth()));
        }
        // monthsLastYear

        return periods;
    },

    _getLastNMonth(noNumber, year, month) {
        const currentYearPeriods = [];

        let count = 0;
        for (let m = month; m >= 1 && count < noNumber; m--) {
            const k = (m >= 10) ? m : `0${m}`;
            currentYearPeriods.push({ id: `${year}${k}`, name: `${year}${k}` });
            count++;
        }

        const lastYearPeriods = [];
        if (count < noNumber - 1) {
            const lastYear = year - 1;
            for (let m = noNumber; m >= 1 && count < noNumber; m--) {
                const k = (m >= 10) ? m : `0${m}`;
                lastYearPeriods.push({ id: `${lastYear}${k}`, name: `${lastYear}${k}` });
                count++;
            }
        }

        let periods = lastYearPeriods.reverse();
        periods = periods.concat(currentYearPeriods.reverse());

        return periods;
    },

    _likeHandler() {
        actions.updateLike(this.props.data, this.props.data.id).subscribe(() => {
            const likeLinkTagId = `likeLink_${this.props.data.id}`;
            $(`#${likeLinkTagId}`).replaceWith("<span class='disabledLink'>Like</span>");

            const likes = this.state.likes + 1;
            const likedBy = this.state.likedBy;
            likedBy.push({ name: this.props.data.user, id: this.props.data.userId });

            this.setState({
                likes,
                likedBy,
            }, function () {
                const peopleLikeTagId = `peopleLike_${this.props.data.id}`;
                const postComentTagId = `postComent_${this.props.data.id}`;
                $(`#${peopleLikeTagId}`).show();
                $(`#${postComentTagId}`).closest('.interpretationCommentArea').show();
            });
        });
    },

    _deleteHandler() {
        actions.deleteInterpretation(this.props.data, this.props.data.id)
			.subscribe(() => {
    this.props.deleteInterpretationSuccess(this.props.data.id);
		});
    },

    _showEditHandler() {
        const divEditText = `edit_${this.props.data.id}`;
        const divShowText = `show_${this.props.data.id}`;
        $(`#${divEditText}`).show();
        $(`#${divShowText}`).hide();
    },

    _editInterpretationTextSuccess(text) {
        this.props.data.text = text;

        const divEditText = `edit_${this.props.data.id}`;
        const divShowText = `show_${this.props.data.id}`;
        $(`#${divEditText}`).hide();
        $(`#${divShowText}`).show();

        this.setState({ text });
    },

    _getCommentAreaClazz() {
        let commentAreaClazzNames = 'interpretationCommentArea';
        if (this.props.data.comments.length === 0 && this.state.likes === 0) {
            commentAreaClazzNames += ' hidden';
        }

        return commentAreaClazzNames;
    },

    _openPeopleLikedHandler() {
        this.setState({
            open: true,
        });
    },

    _closePeopleLikedHandler() {
        this.setState({
            open: false,
        });
    },

    render() {
        const likeLinkTagId = `likeLink_${this.props.data.id}`;
        const interpretationTagId = `interpretation_${this.props.data.id}`;
        const peopleLikeTagId = `peopleLike_${this.props.data.id}`;
        const commentAreaKey = `commentArea_${this.props.data.id}`;
        const messageOwnerKey = `messageOwnerKey_${this.props.data.id}`;
        const likeDialogKey = `likeDialogKey_${this.props.data.id}`;

        const peopleLikedByDialogActions = [
            <FlatButton type="button"
                onClick={this._closePeopleLikedHandler}
                label="Cancel"
                primary
            />,
        ];

        return (
			<div id={interpretationTagId} key={interpretationTagId}>
				<div className="interpretationContainer" >

                    <div>
                        <div className="interpretationItem">
                            <div className="title">{this.props.data.name}</div>
                            <div id={this.props.data.id}></div>
                        </div>
                    </div>

                    <MessageOwner key={messageOwnerKey} data={this.props.data} text={this.state.text} editInterpretationTextSuccess={this._editInterpretationTextSuccess} />

                    <div className="linkTag">
                        <a onClick={this._likeHandler} id={likeLinkTagId}>  Like </a> |
                        <span className={this.props.currentUser.id === this.props.data.userId || this.props.currentUser.superUser ? '' : 'hidden'} >
                        <a onClick={this._showEditHandler}>  Edit </a> |
                        <a onClick={this._deleteHandler}>  Delete </a>
                        </span>
                    </div>

                     <div className={this._getCommentAreaClazz()} >
                        <div id={peopleLikeTagId} className={this.state.likes > 0 ? '' : 'hidden'}>
                            <img src="images/like.png" /> <a onClick={this._openPeopleLikedHandler}>{this.state.likes} people</a><span> liked this.</span>
                            <br />
                        </div>
                        <CommentArea key={commentAreaKey} comments={this.state.comments} likes={this.state.likes} interpretationId={this.props.data.id} likedBy={this.state.likedBy} currentUser={this.props.currentUser} />


                        <Dialog
                            title="People"
                            actions={peopleLikedByDialogActions}
                            modal
                            open={this.state.open}
                            onRequestClose={this._closePeopleLikedHandler}
                        >
                            <div key={likeDialogKey}>
                                {this.state.likedBy.map(likedByUserName =>
                                    <p key={likedByUserName.id}>{likedByUserName.name}</p>
                                )}
                            </div>
                        </Dialog>


                    </div>
                </div>
			</div>
		);
    },
});

export default Interpretation;
